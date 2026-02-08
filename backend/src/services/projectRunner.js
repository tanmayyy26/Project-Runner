/**
 * Project Runner Service
 * 
 * Handles the full lifecycle of running a GitHub project:
 * 1. Clone the repository
 * 2. Detect project type
 * 3. Execute the project natively (no Docker)
 * 4. Stream logs in real-time
 * 5. Cleanup resources
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const simpleGit = require('simple-git');

const projectDetector = require('./projectDetector');

// Temporary directory for cloned repositories
const TEMP_CLONE_DIR = path.join(process.cwd(), 'temp-projects');

/**
 * Main function to run a GitHub project
 * 
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} branch - Branch to clone (default: main)
 * @param {Function} logCallback - Callback to send log messages
 * @returns {Promise<void>}
 */
async function runProject(githubUrl, branch = 'main', logCallback) {
  const projectId = generateProjectId();
  const projectDir = path.join(TEMP_CLONE_DIR, projectId);

  try {
    // Create temp directory
    await fs.mkdir(TEMP_CLONE_DIR, { recursive: true });

    // Log: Starting
    logCallback({
      status: 'progress',
      message: '📥 Cloning repository...'
    });

    // Clone repository
    const git = simpleGit();
    await git.clone(githubUrl, projectDir, ['--branch', branch, '--depth', '1']);

    logCallback({
      status: 'progress',
      message: '✅ Repository cloned successfully'
    });

    // Detect project type
    logCallback({
      status: 'progress',
      message: '🔍 Detecting project type...'
    });

    const projectType = await projectDetector.detectProjectType(projectDir);

    logCallback({
      status: 'progress',
      message: `✅ Detected ${projectType.type} project${projectType.framework ? ` (${projectType.framework})` : ''}`
    });

    // Prepare and run project
    logCallback({
      status: 'progress',
      message: `⚙️  Preparing to run ${projectType.type} project...`
    });

    await runProjectNatively(projectDir, projectType, logCallback);

    logCallback({
      status: 'progress',
      message: '✅ Project execution completed'
    });

  } catch (error) {
    logCallback({
      status: 'error',
      message: `❌ Error: ${error.message}`
    });
    throw error;

  } finally {
    // Cleanup
    logCallback({
      status: 'progress',
      message: '🧹 Cleaning up resources...'
    });

    try {
      await cleanupProject(projectDir);
      logCallback({
        status: 'progress',
        message: '✅ Cleanup completed'
      });
    } catch (cleanupError) {
      logCallback({
        status: 'warning',
        message: `⚠️  Cleanup warning: ${cleanupError.message}`
      });
    }
  }
}

/**
 * Run project natively without Docker
 */
async function runProjectNatively(projectDir, projectType, logCallback) {
  return new Promise((resolve, reject) => {
    let shellCommand;

    // Get package.json to check for npm scripts
    const packageJsonPath = `${projectDir}/package.json`;
    let packageJson = null;
    
    try {
      packageJson = require(packageJsonPath);
    } catch (e) {
      // File might not exist or be invalid
    }

    switch (projectType.type) {
      case 'nodejs':
        // Check if npm start script exists
        if (packageJson && packageJson.scripts && packageJson.scripts.start) {
          shellCommand = 'npm install && npm start';
        } else if (packageJson && packageJson.scripts && packageJson.scripts.build) {
          // If only build script exists, run that
          shellCommand = 'npm install && npm run build';
        } else {
          // If no scripts, just install dependencies
          logCallback({
            status: 'warning',
            message: '⚠️ No start or build script found in package.json. Installing dependencies only.'
          });
          shellCommand = 'npm install';
        }
        break;

      case 'python':
        // Check if main.py exists
        const mainPyPath = `${projectDir}/main.py`;
        try {
          require('fs').accessSync(mainPyPath);
          shellCommand = 'pip install -r requirements.txt 2>/dev/null || true && python main.py';
        } catch {
          // main.py doesn't exist, just install
          logCallback({
            status: 'warning',
            message: '⚠️ No main.py found. Installing dependencies only.'
          });
          shellCommand = 'pip install -r requirements.txt 2>/dev/null || true';
        }
        break;

      case 'java':
        shellCommand = 'mvn clean install && mvn spring-boot:run || mvn exec:java';
        break;

      default:
        return reject(new Error(`Unsupported project type: ${projectType.type}. Supported: nodejs, python, java`));
    }

    logCallback({
      status: 'progress',
      message: `🚀 Running: ${shellCommand}`
    });

    const process = spawn('sh', ['-c', shellCommand], {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      timeout: 600000
    });

    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error('Project execution timeout (10 minutes)'));
    }, 600000);

    // Handle stdout
    process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          logCallback({
            status: 'output',
            message: line
          });
        }
      });
    });

    // Handle stderr
    process.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          logCallback({
            status: 'output',
            message: `⚠️  ${line}`
          });
        }
      });
    });

    // Handle process exit
    process.on('close', (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        logCallback({
          status: 'progress',
          message: '✅ Project completed successfully'
        });
        resolve();
      } else if (code === null) {
        logCallback({
          status: 'warning',
          message: '⚠️ Project execution terminated'
        });
        resolve(); // Don't fail if terminated
      } else {
        logCallback({
          status: 'warning',
          message: `⚠️ Project exited with code ${code} (this may be normal for libraries/build tools)`
        });
        resolve(); // Don't reject - exit code might be normal
      }
    });

    process.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Cleanup project directory
 */
async function cleanupProject(projectDir) {
  try {
    await fs.rm(projectDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Generate unique project ID
 */
function generateProjectId() {
  return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  runProject
};
