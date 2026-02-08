/**
 * GitHub Project Runner - Backend Server
 * 
 * This server provides an API to:
 * 1. Accept GitHub repository URLs
 * 2. Clone repositories
 * 3. Detect project types
 * 4. Run projects in Docker containers
 * 5. Stream logs back to the frontend in real-time
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Disable Docker - run natively on Render
process.env.DOCKER_ENABLED = 'false';

// Import route handlers and utilities
const projectRunner = require('./services/projectRunner');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Serve frontend static files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    docker: process.env.DOCKER_ENABLED === 'true' ? 'enabled' : 'disabled'
  });
});

/**
 * GET /run (EventSource support)
 * 
 * Query Parameters:
 * - url: GitHub repository URL
 * - branch: Branch name (optional, defaults to main)
 * 
 * Uses Server-Sent Events (SSE) to stream logs in real-time
 */
app.get('/run', async (req, res) => {
  try {
    const { url, branch = 'main' } = req.query;

    // Validate input
    if (!url) {
      return res.status(400).json({ error: 'GitHub repository URL is required' });
    }

    if (!isValidGitHubUrl(url)) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL format' });
    }

    // Set up Server-Sent Events for streaming logs
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering

    const executionId = generateExecutionId();
    console.log(`[${executionId}] Starting project execution (GET) for: ${url}`);

    // Send initial message
    sendSSEMessage(res, {
      status: 'started',
      id: executionId,
      message: 'Initializing project execution...'
    });

    // Run the project asynchronously
    projectRunner.runProject(url, branch, (message) => {
      sendSSEMessage(res, message);
    }).then(() => {
      sendSSEMessage(res, {
        status: 'completed',
        id: executionId,
        message: 'Project execution completed'
      });
      res.end();
    }).catch((error) => {
      console.error(`[${executionId}] Error:`, error);
      sendSSEMessage(res, {
        status: 'error',
        id: executionId,
        message: error.message,
        error: true
      });
      res.end();
    });
  } catch (error) {
    console.error('Error in /run GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /run
 * 
 * Endpoint to run a GitHub project
 * 
 * Request Body:
 * {
 *   "url": "https://github.com/user/repo",
 *   "branch": "main" (optional, defaults to main)
 * }
 * 
 * Returns:
 * {
 *   "id": "execution-id",
 *   "status": "running",
 *   "message": "Project execution started"
 * }
 * 
 * Uses Server-Sent Events (SSE) to stream logs in real-time
 */
app.post('/run', async (req, res) => {
  try {
    const { url, branch = 'main' } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({ error: 'GitHub repository URL is required' });
    }

    if (!isValidGitHubUrl(url)) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL format' });
    }

    // Set up Server-Sent Events for streaming logs
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');

    const executionId = generateExecutionId();
    console.log(`[${executionId}] Starting project execution (POST) for: ${url}`);

    // Send initial message
    sendSSEMessage(res, {
      status: 'started',
      id: executionId,
      message: 'Initializing project execution...'
    });

    // Run the project asynchronously
    projectRunner.runProject(url, branch, (message) => {
      sendSSEMessage(res, message);
    }).then(() => {
      sendSSEMessage(res, {
        status: 'completed',
        id: executionId,
        message: 'Project execution completed'
      });
      res.end();
    }).catch((error) => {
      console.error(`[${executionId}] Error:`, error);
      sendSSEMessage(res, {
        status: 'error',
        id: executionId,
        message: error.message,
        error: true
      });
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(`[${executionId}] Client disconnected`);
      res.end();
    });
  } catch (error) {
    console.error('Error in /run POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Helper function to validate GitHub URLs
 * Accepts formats like:
 * - https://github.com/user/repo
 * - https://github.com/user/repo.git
 * - github.com/user/repo
 */
function isValidGitHubUrl(url) {
  const githubPattern = /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/[\w.-]+(\/.git)?$/;
  return githubPattern.test(url);
}

/**
 * Generate a unique execution ID
 */
function generateExecutionId() {
  return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * Send Server-Sent Event message to client
 */
function sendSSEMessage(res, data) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    console.error('Error sending SSE message:', error);
  }
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   GitHub Project Runner Backend        ║
║   Server running on port ${PORT}         ║
║   Frontend served from ./public         ║
╚════════════════════════════════════════╝
  `);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Docker: ${process.env.DOCKER_ENABLED === 'true' ? 'enabled' : 'disabled'}`);
});

module.exports = app;
