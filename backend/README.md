# GitHub Project Runner Backend

This backend service orchestrates running public GitHub repositories in Docker containers, auto-detects project type, streams logs, and cleans up resources.

## Features
- Clone and validate GitHub repositories
- Auto-detect project type (Node.js, Python, Java)
- Run projects in isolated Docker containers
- Stream logs via Server-Sent Events (SSE)
- Resource limits and auto cleanup
- Centralized error handling

## Getting Started

1. Ensure Docker is running.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend:
   ```bash
   npm start
   ```
4. Backend API available at [http://localhost:4000/api](http://localhost:4000/api)

## Project Structure
- src/services/projectRunner.js: Orchestrates project execution
- src/services/projectDetector.js: Detects project type
- src/services/dockerService.js: Manages Docker containers
- src/middleware/errorHandler.js: Error handling
- src/index.js: Express server

## API Reference
See API_EXAMPLES.md for endpoint usage.

## Troubleshooting
- Ensure Docker is running
- Check .env configuration
- Review logs for errors

## License
MIT
