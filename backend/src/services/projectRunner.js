/**
 * Project Runner Service
 * 
 * Handles the full lifecycle of running a GitHub project:
 * 1. Clone the repository
 * 2. Detect project type
 * 3. Prepare Docker environment
 * 4. Execute the project
 * 5. Stream logs in real-time
 * 6. Cleanup resources
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const simpleGit = require('simple-git');
const { v4: uuidv4 } = require('uuid');

const projectDetector = require('./projectDetector');
const dockerService = require('./dockerService');

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
