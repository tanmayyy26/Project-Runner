/**
 * Docker Service
 * 
 * Handles running projects inside Docker containers with:
 * - Automatic dependency installation
 * - Real-time log streaming
 * - Resource limits (CPU, memory)
 * - Automatic cleanup after execution
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const projectDetector = require('./projectDetector');

// Configuration from environment
const MEMORY_LIMIT = process.env.CONTAINER_MEMORY_LIMIT || '512m';
const CPU_LIMIT = process.env.CONTAINER_CPU_LIMIT || '1';
const CONTAINER_TIMEOUT = parseInt(process.env.CONTAINER_TIMEOUT || '600000');

/**
 * Run project in a Docker container
 * 
 * @param {string} projectPath - Path to the cloned project
 * @param {Object} projectInfo - Project information from detector
 * @param {string} executionId - Execution ID for logging
 * @param {Function} logCallback - Callback to send logs
 * @returns {Promise<void>}
 */
async function runInContainer(projectPath, projectInfo, executionId, logCallback) {
  if (process.env.DOCKER_ENABLED !== 'true') {
    logCallback({
      status: 'warning',
      message: '⚠️  Docker is disabled. Running in development mode (not recommended for production)...'
    });
    return runLocalProject(projectPath, projectInfo, logCallback);
  }

  const containerName = `github-runner-${executionId}`;
  
  try {
    // Select appropriate Docker image based on project type
    const dockerImage = getDockerImage(projectInfo.type);

    logCallback({
      status: 'progress',
      message: `Starting Docker container with image: ${dockerImage}`
    });

    // Build the docker run command
    const dockerCommand = [
      'run',
      '--rm', // Automatically remove container on exit
      '--name', containerName,
      `-m=${MEMORY_LIMIT}`, // Memory limit
      `--cpus=${CPU_LIMIT}`, // CPU limit
      '-v', `${projectPath}:/app`, // Mount project volume
      '-w', '/app', // Set working directory
      dockerImage,
      'bash', // Shell
      '-c', // Command
      buildInstallAndRunCommand(projectInfo)
    ];

    logCallback({
      status: 'progress',
      message: `Running: docker ${dockerCommand.join(' ')}`
    });

    // Execute Docker container
    await executeDockerContainer(dockerCommand, executionId, logCallback);

    logCallback({
      status: 'progress',
      message: `✅ Container execution completed successfully`
    });

  } catch (error) {
    logCallback({
      status: 'error',
      message: `❌ Docker execution error: ${error.message}`,
      error: true
    });

    // Try to clean up container if it still exists
    try {
      await cleanupContainer(containerName);
    } catch (cleanupError) {
      console.error('Error cleaning up container:', cleanupError);
    }

    throw error;
  }
}

/**
 * Select appropriate Docker image based on project type
 * 
 * @param {string} projectType - Type of project
 * @returns {string} - Docker image name
 */
function getDockerImage(projectType) {
  const images = {
    [projectDetector.PROJECT_TYPES.NODEJS]: 'node:18-alpine',
    [projectDetector.PROJECT_TYPES.PYTHON]: 'python:3.11-slim',
    [projectDetector.PROJECT_TYPES.JAVA]: 'openjdk:17-slim'
  };

  return images[projectType] || 'ubuntu:22.04';
}

/**
 * Build the install and run command for the container
 * 
 * @param {Object} projectInfo - Project information
 * @returns {string} - Combined shell command
 */
function buildInstallAndRunCommand(projectInfo) {
  const commands = [
    'echo "=== Installation Started ===" && echo'
  ];

  // Add installation command
  if (projectInfo.commands.install) {
    commands.push(projectInfo.commands.install);
    commands.push('echo "=== Installation Completed ===" && echo');
  }

  // Add run command
  if (projectInfo.commands.run) {
    commands.push('echo "=== Running Project ===" && echo');
    commands.push(projectInfo.commands.run);
  }

  return commands.join(' && ');
}

/**
 * Execute Docker container and stream logs
 * 
 * @param {string[]} dockerArgs - Arguments for docker command
 * @param {string} executionId - Execution ID
 * @param {Function} logCallback - Log callback
 * @returns {Promise<void>}
 */
function executeDockerContainer(dockerArgs, executionId, logCallback) {
  return new Promise((resolve, reject) => {
    const docker = spawn('docker', dockerArgs);
    let timeoutHandle;

    // Set timeout for container execution
    timeoutHandle = setTimeout(() => {
      logCallback({
        status: 'warning',
        message: `⚠️  Container execution timeout (${CONTAINER_TIMEOUT}ms)`
      });
      docker.kill();
    }, CONTAINER_TIMEOUT);

    // Stream stdout
    docker.stdout.on('data', (data) => {
      const output = data.toString();
      logCallback({
        status: 'output',
        message: output
      });
    });

    // Stream stderr
    docker.stderr.on('data', (data) => {
      const output = data.toString();
      logCallback({
        status: 'output',
        message: output,
        isError: true
      });
    });

    // Handle process exit
    docker.on('close', (code) => {
      clearTimeout(timeoutHandle);

      if (code === 0) {
        resolve();
      } else if (code === 137 || code === 143) {
        // Process was killed (timeout)
        reject(new Error('Container execution timeout or was terminated'));
      } else {
        reject(new Error(`Docker container exited with code ${code}`));
      }
    });

    // Handle process errors
    docker.on('error', (error) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`Failed to spawn Docker process: ${error.message}`));
    });
  });
}

/**
 * Run project locally (for development/testing without Docker)
 * 
 * @param {string} projectPath - Project path
 * @param {Object} projectInfo - Project information
 * @param {Function} logCallback - Log callback
 * @returns {Promise<void>}
 */
async function runLocalProject(projectPath, projectInfo, logCallback) {
  return new Promise((resolve, reject) => {
    logCallback({
      status: 'progress',
      message: `📦 Installing dependencies...`
    });

    const installProcess = spawn('bash', ['-c', projectInfo.commands.install], {
      cwd: projectPath,
      shell: true
    });

    installProcess.stdout.on('data', (data) => {
      logCallback({
        status: 'output',
        message: data.toString()
      });
    });

    installProcess.stderr.on('data', (data) => {
      logCallback({
        status: 'output',
        message: data.toString(),
        isError: true
      });
    });

    installProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Installation failed with code ${code}`));
      }

      logCallback({
        status: 'progress',
        message: `🚀 Starting project...`
      });

      const runProcess = spawn('bash', ['-c', projectInfo.commands.run], {
        cwd: projectPath,
        shell: true
      });

      runProcess.stdout.on('data', (data) => {
        logCallback({
          status: 'output',
          message: data.toString()
        });
      });

      runProcess.stderr.on('data', (data) => {
        logCallback({
          status: 'output',
          message: data.toString(),
          isError: true
        });
      });

      runProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Project execution failed with code ${code}`));
        }
      });
    });
  });
}

/**
 * Cleanup Docker container
 * 
 * @param {string} containerName - Container name
 * @returns {Promise<void>}
 */
function cleanupContainer(containerName) {
  return new Promise((resolve, reject) => {
    const cleanup = spawn('docker', ['rm', '-f', containerName]);

    cleanup.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to remove container: ${containerName}`));
      }
    });

    cleanup.on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = {
  runInContainer
};
