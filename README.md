# GitHub Project Runner

A full-stack web application for cloning and executing GitHub repositories natively on the server. Simply submit a GitHub URL, and the application detects the project type, installs dependencies, and runs the project.

## Features

- **Repository Cloning** - Clone any public GitHub repository
- **Project Detection** - Automatically detect Node.js, Python, Java projects
- **Native Execution** - Run projects without Docker overhead (optimized for free tier)
- **Real-time Logs** - Stream execution logs to browser in real-time
- **Automatic Cleanup** - Clean up temporary files after execution
- **Error Handling** - Comprehensive error messages and logging

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js, Express.js, simple-git |
| **Frontend** | React 18, Axios |
| **Deployment** | Render.com (free tier) |
| **Languages** | JavaScript, Python, Java |

## Project Structure

```
github-project-runner/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── index.js           # Server entry point
│   │   ├── middleware/        # Express middleware
│   │   └── services/
│   │       ├── projectDetector.js    # Detect project type
│   │       └── projectRunner.js      # Execute projects
│   ├── package.json
│   └── .gitignore
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API client
│   │   ├── styles/            # CSS files
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── docker/                    # Docker configurations
├── render.yaml               # Render deployment config
├── setup.bat                 # Windows setup
├── setup.sh                  # Unix setup
├── start.sh                  # Start application
└── LICENSE
```

## Quick Start

### Prerequisites

- **Node.js** v16+ and npm
- **Git**
- **Runtime support** (Python 3.7+, Java JDK for respective projects)

### Setup

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
chmod +x setup.sh start.sh
./setup.sh
```

### Run Locally

**Windows:**
```bash
start.sh
```

**macOS/Linux:**
```bash
./start.sh
```

Then open: `http://localhost:3000`

## API Reference

### POST `/api/execute`

Execute a GitHub repository.

**Request:**
```json
{
  "githubUrl": "https://github.com/user/repo.git",
  "branch": "main"
}
```

**Response:** Server-Sent Events (SSE) stream

**Example events:**
```
data: {"status":"progress","message":"📥 Cloning repository..."}
data: {"status":"output","message":"npm install"}
data: {"status":"progress","message":"✅ Project execution completed"}
```

## Supported Project Types

| Type | Detection | Build | Run |
|------|-----------|-------|-----|
| **Node.js** | package.json | `npm install` | `npm start` |
| **Python** | requirements.txt / setup.py | `pip install` | `python main.py` |
| **Java** | pom.xml | `mvn install` | `mvn spring-boot:run` |

## Environment Variables

Create `.env.local` in backend directory:

```env
NODE_ENV=development
PORT=5000
TEMP_DIR=./temp-projects
LOG_LEVEL=debug
```

## Deployment

### Render.com

1. Connect GitHub repository to Render
2. Create new Web Service
3. Build: `npm install && npm start`
4. Start: `npm start`
5. Environment: Node.js

See `render.yaml` for full configuration.

## Execution Flow

```
1. User submits GitHub URL
   ↓
2. Repository cloned with git (shallow clone)
   ↓
3. Project type detected (Node.js/Python/Java)
   ↓
4. Dependencies installed (npm/pip/mvn)
   ↓
5. Project executed natively
   ↓
6. Logs streamed in real-time
   ↓
7. Temporary files cleaned up
   ↓
8. Results returned to user
```

## Performance

- **Shallow Clone** - Only latest commit downloaded (`--depth=1`)
- **Native Execution** - Eliminated Docker overhead for free tier compatibility
- **Streaming Logs** - Real-time output without buffering
- **Auto Cleanup** - Prevents disk space issues

## Known Limitations

### Connection Timeouts on Free Hosting

**Issue:** Render.com's free tier has hard HTTP connection limits (~2-3 minutes) that cannot be bypassed.

**Impact:**
- Very large projects (Next.js 16, large React apps) with 15-30 min build times will timeout
- Connection drops trigger reconnections, but each reconnection starts a NEW execution
- This creates infinite loops for projects that never complete within the timeout

**Recommended Projects for Demo:**
- ✅ Simple Express/Node.js apps (< 2 min)
- ✅ Small React apps (< 5 min build)
- ✅ Python Flask/FastAPI apps
- ✅ Basic Java Spring Boot apps
- ❌ Large Next.js 16 apps (20-30 min builds)
- ❌ Complex enterprise applications

**Solution for Production:**
- Upgrade to Render paid tier (no connection limits)
- Use dedicated servers (AWS EC2, DigitalOcean)
- Implement job queue system (Redis + workers)
- Use polling instead of SSE for long operations

## Troubleshooting

**Port Already in Use:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

**Repository Clone Fails:**
- Verify GitHub URL format
- Check internet connectivity
- Ensure repository is public

**Project Execution Fails:**
- Check project has valid entry point
- Verify required runtime is installed
- Review error logs in terminal

**No Logs Appearing:**
- Verify backend is running on port 5000
- Check browser network tab for SSE connection
- Ensure CORS is enabled

## File Cleanup

All temporary project directories are automatically removed after execution in the `temp-projects/` folder. No manual cleanup required.

## Supported Platforms

- ✅ Linux (Ubuntu, Debian, Alpine)
- ✅ macOS (Intel & ARM)
- ✅ Windows 10/11

## Version

**v1.0.0** - Native execution optimized for Render free tier

## License

MIT License - See LICENSE file

## Quick Commands

```bash
# Development
npm run dev              # Backend with auto-reload (requires nodemon)
npm start               # Run application

# Production
npm start               # Run application

# Setup
./setup.sh             # Install dependencies (Unix)
setup.bat              # Install dependencies (Windows)
```

---

**GitHub Project Runner** - Run any GitHub project remotely
