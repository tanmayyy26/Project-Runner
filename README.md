# 🚀 GitHub Project Runner

**A full-stack application that allows you to run any public GitHub repository remotely without downloading it locally.**

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Architecture](#architecture)
- [Features](#features)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Security & Cleanup](#security--cleanup)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)

---

## 🎯 Problem Statement

Running code from GitHub repositories often requires:
- **Downloading** the entire project locally
- **Setting up** the development environment
- **Installing** dependencies
- **Managing** multiple versions of different runtimes
- **Cleaning up** after execution

**GitHub Project Runner** solves this by:
- Accepting a GitHub URL directly
- Running the project in an isolated Docker container
- Streaming live logs in real-time
- Automatically cleaning up resources
- Supporting multiple project types (Node.js, Python, Java)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GitHub Project Runner Frontend (React)                │ │
│  │  • URL Input Component                                 │ │
│  │  • Terminal Output Panel                               │ │
│  │  • Real-time Log Streaming (SSE)                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓ HTTP/SSE
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Express)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POST /run                                             │ │
│  │  • Clone GitHub Repository                            │ │
│  │  • Detect Project Type                                │ │
│  │  • Stream Logs (SSE)                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓ Docker API
┌─────────────────────────────────────────────────────────────┐
│                     Docker Container                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Isolated Execution Environment                        │ │
│  │  • Install Dependencies (npm, pip, mvn)               │ │
│  │  • Run Project                                         │ │
│  │  • Resource Limits (CPU, Memory)                       │ │
│  │  • Automatic Cleanup                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Frontend
- ✅ Clean, modern UI built with React
- ✅ Input field for GitHub repository URLs
- ✅ "Run Project" button with loading state
- ✅ Terminal-style output panel with real-time logs
- ✅ Error handling with user-friendly messages
- ✅ Responsive design (works on desktop and mobile)
- ✅ Live status indicators

### Backend
- ✅ Express.js API server
- ✅ Git repository cloning with depth option
- ✅ Automatic project type detection
- ✅ Support for Node.js, Python, and Java projects
- ✅ Real-time log streaming via Server-Sent Events (SSE)
- ✅ Error handling and graceful failures
- ✅ Health check endpoint

### Docker Integration
- ✅ Isolated container execution
- ✅ CPU and memory limits
- ✅ Automatic dependency installation
- ✅ Container timeout mechanism
- ✅ Automatic resource cleanup

### Security & Performance
- ✅ No persistent storage of projects
- ✅ Automatic container removal after execution
- ✅ Resource limits prevent abuse
- ✅ Input validation for GitHub URLs
- ✅ CORS enabled for cross-origin requests

---

## 📦 Requirements

### System Requirements
- **Docker** (v20.10+) - Required for running projects in containers
- **Docker Compose** (v1.29+) - Optional, for orchestration
- **Node.js** (v18+) - For running backend and frontend
- **npm** (v9+) - Package manager
- **Git** - For cloning repositories

### Environment Setup
- Linux, macOS, or Windows with Docker Desktop
- Minimum 2GB RAM (4GB recommended)
- Minimum 5GB free disk space

---

## 🚀 Getting Started

### 1. Installation

#### Clone the repository
```bash
git clone https://github.com/yourusername/github-project-runner.git
cd github-project-runner
```

#### Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

#### Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 2. Configuration

#### Create Backend Environment File
```bash
cd backend
cp .env.example .env
```

Edit `.env` if needed:
```env
PORT=5000
DOCKER_ENABLED=true
CONTAINER_MEMORY_LIMIT=512m
CONTAINER_CPU_LIMIT=1
CONTAINER_TIMEOUT=600000
```

### 3. Running Locally

#### Option A: Using Docker Compose (Recommended)
```bash
# From project root
docker-compose -f docker/docker-compose.yml up
```

Then open: `http://localhost:3000`

#### Option B: Manual Startup

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
# Backend runs on http://localhost:5000
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

### 4. Verify Installation

Check backend health:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T...",
  "docker": "enabled"
}
```

---

## 📁 Project Structure

```
github-project-runner/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── RepositoryInput.js
│   │   │   └── TerminalOutput.js
│   │   ├── services/         # API service
│   │   │   └── api.js
│   │   ├── styles/           # CSS files
│   │   │   ├── App.css
│   │   │   ├── RepositoryInput.css
│   │   │   └── TerminalOutput.css
│   │   ├── App.js            # Main app component
│   │   └── index.js          # React entry point
│   ├── public/
│   │   └── index.html        # HTML template
│   └── package.json
│
├── backend/                  # Node.js/Express backend
│   ├── src/
│   │   ├── services/         # Business logic
│   │   │   ├── projectRunner.js    # Main runner
│   │   │   ├── projectDetector.js  # Type detection
│   │   │   └── dockerService.js    # Docker handling
│   │   ├── middleware/
│   │   │   └── errorHandler.js     # Error handling
│   │   └── index.js          # Express server
│   ├── .env.example          # Environment template
│   └── package.json
│
├── docker/                   # Docker configuration
│   ├── Dockerfile            # Multi-stage Dockerfile
│   ├── Dockerfile.backend    # Backend service
│   ├── Dockerfile.frontend   # Frontend service
│   ├── docker-compose.yml    # Docker Compose config
│   └── nginx.conf            # Nginx configuration
│
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000
```

### Endpoints

#### 1. Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T10:30:00.000Z",
  "docker": "enabled"
}
```

#### 2. Run Project
```
POST /run
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://github.com/user/repo",
  "branch": "main"
}
```

**Response:** Server-Sent Events (SSE) stream

**Example Events:**
```
data: {"status":"started","id":"a1b2c3d4","message":"Initializing project execution..."}

data: {"status":"progress","message":"📥 Cloning repository from https://github.com/user/repo..."}

data: {"status":"output","message":"npm WARN using --force, recommended protections disabled"}

data: {"status":"completed","id":"a1b2c3d4","message":"Project execution completed"}
```

**Message Types:**

| Status | Description | Example |
|--------|-------------|---------|
| `started` | Execution started | - |
| `progress` | Progress update | "Cloning repository..." |
| `output` | Project output | Log lines |
| `warning` | Warning message | "Resource limit" |
| `error` | Error occurred | "Failed to clone" |
| `completed` | Execution finished | - |

---

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `DOCKER_ENABLED` | true | Enable Docker execution |
| `CONTAINER_MEMORY_LIMIT` | 512m | Memory limit per container |
| `CONTAINER_CPU_LIMIT` | 1 | CPU limit per container |
| `CONTAINER_TIMEOUT` | 600000 | Timeout in milliseconds (10 min) |
| `CLONE_TIMEOUT` | 30000 | Repository clone timeout |

### Project Detection

The backend automatically detects project types:

#### Node.js
- **Marker:** `package.json`
- **Install:** `npm install`
- **Run:** `npm start`
- **Image:** `node:18-alpine`

#### Python
- **Marker:** `requirements.txt`, `main.py`, `setup.py`, or `Pipfile`
- **Install:** `pip install -r requirements.txt`
- **Run:** `python main.py`
- **Image:** `python:3.11-slim`

#### Java
- **Marker:** `pom.xml` or `build.gradle`
- **Install:** `mvn clean compile`
- **Run:** `mvn exec:java`
- **Image:** `openjdk:17-slim`

---

## 🔒 Security & Cleanup

### Security Features

1. **Isolated Containers**
   - Each project runs in its own Docker container
   - No access to host filesystem (except mounted project)
   - Network isolation available

2. **Resource Limits**
   - Memory limit: 512MB (configurable)
   - CPU limit: 1 core (configurable)
   - Execution timeout: 10 minutes (configurable)

3. **Input Validation**
   - GitHub URL format validation
   - Branch name validation
   - Prevents injection attacks

4. **Automatic Cleanup**
   - Temporary project directories removed after execution
   - Docker containers removed immediately after completion
   - No persistent storage of user data

### Cleanup Process

```
1. Project execution starts
   ↓
2. Repository cloned to temp directory
   ↓
3. Project runs in Docker container
   ↓
4. Logs streamed in real-time
   ↓
5. Project completes or times out
   ↓
6. Container stopped and removed
   ↓
7. Temp directory deleted
   ↓
8. Resources released
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 5000 is in use
lsof -i :5000
# Kill process if needed
kill -9 <PID>

# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
npm start
```

### Docker Not Available
```bash
# Install Docker
# macOS: https://docs.docker.com/docker-for-mac/install/
# Windows: https://docs.docker.com/docker-for-windows/install/
# Linux: https://docs.docker.com/engine/install/

# Test Docker installation
docker --version
docker run hello-world
```

### Project Fails to Clone
- Verify GitHub URL format
- Check internet connection
- Ensure repository is public
- Verify branch name exists

### Container Exits Immediately
- Check project has proper entry point
- Verify dependencies are installed
- Review Docker container logs
- Increase timeout if needed

### No Logs Appearing
- Check backend is running
- Verify network connection
- Check browser console for errors
- Ensure CORS is enabled

### Memory/CPU Limits Too Low
Edit `backend/.env`:
```env
CONTAINER_MEMORY_LIMIT=1024m
CONTAINER_CPU_LIMIT=2
CONTAINER_TIMEOUT=900000
```

---

## 📈 Future Improvements

### Phase 1: Enhanced Detection
- [ ] Support for Go, Rust, C++ projects
- [ ] Docker Compose detection
- [ ] Custom run commands from README.md
- [ ] Monorepo support
- [ ] Submodule handling

### Phase 2: Advanced Features
- [ ] Execution history tracking
- [ ] Favorite repositories
- [ ] Custom environment variables per project
- [ ] Multiple concurrent executions
- [ ] Webhook integration for CI/CD
- [ ] Private repository support (with token)

### Phase 3: UI Enhancements
- [ ] Dark mode toggle
- [ ] Search GitHub repositories
- [ ] Execution logs download
- [ ] Live preview for web projects (iframe)
- [ ] Port forwarding for running services
- [ ] File browser for project structure

### Phase 4: Performance & Scalability
- [ ] Redis caching for cloned repositories
- [ ] Load balancing for multiple backend instances
- [ ] Database for execution history
- [ ] S3 integration for logs storage
- [ ] CDN for static assets
- [ ] Kubernetes deployment

### Phase 5: Security & Compliance
- [ ] Rate limiting per IP
- [ ] User authentication
- [ ] API key management
- [ ] Audit logging
- [ ] GDPR compliance
- [ ] SOC 2 compliance

### Phase 6: Analytics
- [ ] Execution statistics
- [ ] Popular repositories
- [ ] Performance metrics
- [ ] Error tracking (Sentry)
- [ ] User analytics

---

## 📝 Example Usage

### Running a Node.js Project
```
1. Open http://localhost:3000
2. Enter: https://github.com/facebook/react
3. Leave branch as "main"
4. Click "Run Project"
5. Watch logs stream in real-time
```

### Running a Python Project
```
1. Open http://localhost:3000
2. Enter: https://github.com/psf/black
3. Click "Run Project"
4. Logs will show pip installation and execution
```

### Running a Java Project
```
1. Open http://localhost:3000
2. Enter: https://github.com/torvalds/linux
3. Click "Run Project"
4. Logs will show Maven build and execution
```

---

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues, questions, or suggestions:
- Open an GitHub issue
- Email: support@example.com
- Discord: [Join our community](https://discord.gg/example)

---

**Built with ❤️ by the GitHub Project Runner Team**

Made in 2026 | Last Updated: February 8, 2026
#   P r o j e c t - R u n n e r  
 