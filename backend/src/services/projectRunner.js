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
    let command;
    let args = [];

    switch (projectType.type.toLowerCase()) {
      case 'nodejs':
        command = 'npm';
        args = ['install', '&&', 'npm', 'start'];
        break;

      case 'python':
        command = 'python';
        args = ['-m', 'pip', 'install', '-r', 'requirements.txt', '&&', 'python', 'main.py'];
        break;

      case 'java':
        command = 'mvn';
        args = ['clean', 'install', '&&', 'mvn', 'spring-boot:run'];
        break;

      default:
        return reject(new Error(`Unsupported project type: ${projectType.type}`));
    }

    logCallback({
      status: 'progress',
      message: `🚀 Running: ${command} ${args.join(' ')}`
    });

    // For compound commands, use shell
    const shellCommand = `${command} ${args.join(' ')}`;
    
    const process = spawn('sh', ['-c', shellCommand], {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      timeout: 600000 // 10 minutes max
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
          message: '✅ Project ran successfully'
        });
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
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


/**
 * Main function to run a GitHub project
 * 
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} branch - Branch to clone (default: main)
 * @param {Function} logCallback - Callback to send log messages
 * @returns {Promise<void>}
 */
async function runProject(githubUrl, branch = 'main', logCallback) {
  const executionId = generateExecutionId();
  let projectPath = null;

  try {
    logCallback({
      status: 'progress',
      message: `📥 Cloning repository from ${githubUrl}...`
    });

    // Clone the repository
    projectPath = await cloneRepository(githubUrl, branch, executionId, logCallback);

    logCallback({
      status: 'progress',
      message: `✅ Repository cloned successfully`
    });

    // Detect project type
    logCallback({
      status: 'progress',
      message: `🔍 Detecting project type...`
    });

    const projectInfo = await projectDetector.detectProjectType(projectPath);

    logCallback({
      status: 'progress',
      message: `✅ Detected ${projectInfo.type} project (v${projectInfo.version || 'unknown'})`
    });

    // Run project in Docker
    logCallback({
      status: 'progress',
      message: `🐳 Preparing Docker container...`
    });

    await dockerService.runInContainer(
      projectPath,
      projectInfo,
      executionId,
      logCallback
    );

    logCallback({
      status: 'progress',
      message: `🎉 Project execution finished successfully!`
    });

  } catch (error) {
    logCallback({
      status: 'error',
      message: `❌ Error: ${error.message}`,
      error: true
    });
    throw error;
  } finally {
    // Cleanup: Remove cloned repository
    if (projectPath) {
      logCallback({
        status: 'progress',
        message: `🧹 Cleaning up temporary files...`
      });

      try {
        await cleanupProjectPath(projectPath);
        logCallback({
          status: 'progress',
          message: `✅ Cleanup completed`
        });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  }
}

/**
 * Clone a GitHub repository
 * 
 * @param {string} githubUrl - GitHub URL
 * @param {string} branch - Branch to clone
 * @param {string} executionId - Execution ID for logging
 * @param {Function} logCallback - Log callback
 * @returns {Promise<string>} - Path to cloned repository
 */
async function cloneRepository(githubUrl, branch, executionId, logCallback) {
  try {
    // Ensure temp directory exists
    await fs.mkdir(TEMP_CLONE_DIR, { recursive: true });

    // Generate unique folder for this clone
    const cloneFolderName = `${executionId}-${Date.now()}`;
    const targetPath = path.join(TEMP_CLONE_DIR, cloneFolderName);

    logCallback({
      status: 'progress',
      message: `Cloning into: ${cloneFolderName}...`
    });

    // Clone using simple-git
    const git = simpleGit();
    await git.clone(githubUrl, targetPath, ['-b', branch, '--depth', '1']);

    return targetPath;
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

/**
 * Cleanup project path
 * 
 * @param {string} projectPath - Path to remove
 * @returns {Promise<void>}
 */
async function cleanupProjectPath(projectPath) {
  try {
    await fs.rm(projectPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error removing directory ${projectPath}:`, error);
    throw error;
  }
}

/**
 * Generate execution ID
 * 
 * @returns {string}
 */
function generateExecutionId() {
  return uuidv4().substring(0, 8);
}

module.exports = {
  runProject
};
