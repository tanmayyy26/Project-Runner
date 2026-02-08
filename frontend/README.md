# GitHub Project Runner Frontend

This frontend provides a user interface for running any public GitHub repository remotely. It connects to the backend API, streams logs in real-time, and displays project status.

## Features
- Input GitHub repository URL
- Real-time log streaming
- Project status display
- Responsive design

## Getting Started

1. Ensure the backend and Docker services are running.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm start
   ```
4. Access the UI at [http://localhost:3000](http://localhost:3000)

## Project Structure
- src/components/RepositoryInput.js: GitHub URL input
- src/components/TerminalOutput.js: Log display
- src/services/api.js: API client
- src/styles/: CSS files
- src/App.js: Main app logic

## API Reference
See API_EXAMPLES.md for backend API usage.

## Troubleshooting
- Ensure Docker is running
- Backend must be accessible at /api
- Check browser console for errors

## License
MIT
