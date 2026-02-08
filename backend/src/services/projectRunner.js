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
    let commands = [];

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
        // Always install first
        commands.push({ type: 'npm', args: ['install'] });
        
        // Then check what to run
        if (packageJson && packageJson.scripts && packageJson.scripts.start) {
          commands.push({ type: 'npm', args: ['start'] });
        } else if (packageJson && packageJson.scripts && packageJson.scripts.build) {
          commands.push({ type: 'npm', args: ['run', 'build'] });
        } else {
          logCallback({
            status: 'warning',
            message: '⚠️ No start or build script found in package.json. Dependencies installed.'
          });
        }
        break;

      case 'python':
        // Check if main.py exists
        const mainPyPath = `${projectDir}/main.py`;
        try {
          require('fs').accessSync(mainPyPath);
          commands.push({ type: 'pip', args: ['install', '-r', 'requirements.txt'] });
          commands.push({ type: 'python', args: ['main.py'] });
        } catch {
          logCallback({
            status: 'warning',
            message: '⚠️ No main.py found. Installing dependencies only.'
          });
          commands.push({ type: 'pip', args: ['install', '-r', 'requirements.txt'] });
        }
        break;

      case 'java':
        commands.push({ type: 'mvn', args: ['clean', 'install'] });
        commands.push({ type: 'mvn', args: ['spring-boot:run'] });
        break;

      default:
        return reject(new Error(`Unsupported project type: ${projectType.type}. Supported: nodejs, python, java`));
    }

    // Execute commands sequentially
    executeCommandSequence(commands, projectDir, logCallback, resolve, reject);
  });
}

/**
 * Execute commands one by one using proper process spawning
 */
function executeCommandSequence(commands, projectDir, logCallback, resolve, reject) {
  if (commands.length === 0) {
    resolve();
    return;
  }

  const cmdObj = commands.shift();
  const { type: cmd, args } = cmdObj;

  logCallback({
    status: 'progress',
    message: `🚀 Running: ${cmd} ${args.join(' ')}`
  });

  // Assign dynamic port to avoid conflicts
  // Backend uses 5000, so use 5001+ for executed projects
  const executionPort = 5001 + Math.floor(Math.random() * 1000);
  
  const env = {
    ...process.env,
    PORT: executionPort.toString(),
    // Common port variables used by frameworks
    SERVER_PORT: executionPort.toString(),
    APP_PORT: executionPort.toString(),
    // Prevent Next.js from using port 5000
    NEXT_PUBLIC_API_URL: undefined
  };

  const childProcess = spawn(cmd, args, {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false, // Don't use shell - execute directly
    env: env // Pass environment with dynamic port
  });

  const timeout = setTimeout(() => {
    childProcess.kill();
    logCallback({
      status: 'warning',
      message: '⏱️ Command timeout (10 minutes)'
    });
    reject(new Error('Project execution timeout (10 minutes)'));
  }, 600000);

  // Handle stdout
  childProcess.stdout.on('data', (data) => {
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
  childProcess.stderr.on('data', (data) => {
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
  childProcess.on('close', (code) => {
    clearTimeout(timeout);

    if (code === 0) {
      logCallback({
        status: 'progress',
        message: `✅ ${cmd} completed successfully`
      });
      // Continue to next command
      executeCommandSequence(commands, projectDir, logCallback, resolve, reject);
    } else {
      logCallback({
        status: 'warning',
        message: `⚠️ ${cmd} exited with code ${code} (continuing...)`
      });
      // Continue anyway - might be normal
      executeCommandSequence(commands, projectDir, logCallback, resolve, reject);
    }
  });

  process.on('error', (error) => {
    clearTimeout(timeout);
    logCallback({
      status: 'error',
      message: `❌ Failed to start ${cmd}: ${error.message}`
    });
    reject(error);
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
