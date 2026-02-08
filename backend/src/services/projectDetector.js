/**
 * Project Detector Service
 * 
 * Detects the type of project (Node.js, Python, Java) based on
 * configuration files and structure
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Supported project types
 */
const PROJECT_TYPES = {
  NODEJS: 'Node.js',
  PYTHON: 'Python',
  JAVA: 'Java'
};

/**
 * Detection markers for each project type
 */
const DETECTION_MARKERS = {
  [PROJECT_TYPES.NODEJS]: {
    files: ['package.json'],
    commands: {
      install: 'npm install',
      run: 'npm start'
    }
  },
  [PROJECT_TYPES.PYTHON]: {
    files: ['requirements.txt', 'main.py', 'setup.py', 'Pipfile'],
    commands: {
      install: 'pip install -r requirements.txt',
      run: 'python main.py'
    }
  },
  [PROJECT_TYPES.JAVA]: {
    files: ['pom.xml', 'build.gradle'],
    commands: {
      install: 'mvn clean compile',
      run: 'mvn exec:java'
    }
  }
};

/**
 * Detect project type based on project structure
 * 
 * @param {string} projectPath - Path to the project root
 * @returns {Promise<Object>} - Project information
 */
async function detectProjectType(projectPath) {
  const projectInfo = {
    type: 'Unknown',
    version: null,
    hasReadme: false,
    hasLicense: false,
    commands: {}
  };

  try {
    // Check for each project type
    for (const [type, markers] of Object.entries(DETECTION_MARKERS)) {
      for (const file of markers.files) {
        const filePath = path.join(projectPath, file);
        try {
          await fs.access(filePath);
          
          projectInfo.type = type;
          projectInfo.commands = markers.commands;

          // Get version information
          if (file === 'package.json') {
            projectInfo.version = await getNodeVersion(filePath);
          } else if (file === 'pom.xml') {
            projectInfo.version = await getMavenVersion(filePath);
          } else if (file === 'requirements.txt') {
            projectInfo.version = await getPythonVersion(projectPath);
          }

          break;
        } catch {
          // File doesn't exist, continue checking
        }
      }

      if (projectInfo.type !== 'Unknown') break;
    }

    // Check for additional files
    try {
      await fs.access(path.join(projectPath, 'README.md'));
      projectInfo.hasReadme = true;
    } catch {
      projectInfo.hasReadme = false;
    }

    try {
      await fs.access(path.join(projectPath, 'LICENSE'));
      projectInfo.hasLicense = true;
    } catch {
      projectInfo.hasLicense = false;
    }

    console.log(`Detected project type: ${projectInfo.type}`);
    return projectInfo;

  } catch (error) {
    console.error('Error detecting project type:', error);
    throw new Error(`Failed to detect project type: ${error.message}`);
  }
}

/**
 * Get Node.js version from package.json
 * 
 * @param {string} packageJsonPath - Path to package.json
 * @returns {Promise<string|null>}
 */
async function getNodeVersion(packageJsonPath) {
  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    return packageJson.engines?.node || packageJson.version || null;
  } catch {
    return null;
  }
}

/**
 * Get Maven version from pom.xml
 * 
 * @param {string} pomPath - Path to pom.xml
 * @returns {Promise<string|null>}
 */
async function getMavenVersion(pomPath) {
  try {
    const content = await fs.readFile(pomPath, 'utf-8');
    const versionMatch = content.match(/<version>([^<]+)<\/version>/);
    return versionMatch ? versionMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get Python version by checking shebang or requirements
 * 
 * @param {string} projectPath - Path to project
 * @returns {Promise<string|null>}
 */
async function getPythonVersion(projectPath) {
  try {
    const mainPyPath = path.join(projectPath, 'main.py');
    const content = await fs.readFile(mainPyPath, 'utf-8');
    const shebangMatch = content.match(/#!.*python(\d+\.\d+)?/);
    return shebangMatch ? shebangMatch[1] || '3' : null;
  } catch {
    return null;
  }
}

module.exports = {
  detectProjectType,
  PROJECT_TYPES,
  DETECTION_MARKERS
};
