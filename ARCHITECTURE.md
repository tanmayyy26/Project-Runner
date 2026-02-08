# GitHub Project Runner - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Internet / GitHub                           │
│                      (Public Repositories)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     GitHub Project Runner System                    │
│                                                                      │
│  ┌────────────────────────────┐      ┌─────────────────────────┐   │
│  │   Frontend Layer           │      │   Backend Layer         │   │
│  │  (React Application)       │      │ (Express.js Server)     │   │
│  │                            │      │                         │   │
│  │ ┌──────────────────────┐   │      │ ┌───────────────────┐   │   │
│  │ │ Input Component      │   │      │ │ Project Runner    │   │   │
│  │ │ • GitHub URL input   │   │      │ │ • Git clone       │   │   │
│  │ │ • Branch selector    │   │      │ │ • Type detection  │   │   │
│  │ │ • Submit button      │   │      │ │ • Docker exec     │   │   │
│  │ └──────────┬───────────┘   │      │ └──────────┬────────┘   │   │
│  │            │               │      │            │            │   │
│  │ ┌──────────▼───────────┐   │      │ ┌──────────▼────────┐   │   │
│  │ │ Terminal Component   │   │      │ │ Project Detector  │   │   │
│  │ │ • Live log display   │   │      │ │ • Detect type     │   │   │
│  │ │ • Real-time updates  │   │      │ │ • Extract version │   │   │
│  │ │ • Error highlighting │   │      │ │ • Get commands    │   │   │
│  │ └──────────────────────┘   │      │ └──────────────────┘   │   │
│  │                            │      │                         │   │
│  │ ┌──────────────────────┐   │      │ ┌───────────────────┐   │   │
│  │ │ API Service          │   │      │ │ Docker Service    │   │   │
│  │ │ • EventSource (SSE)  │   │      │ │ • Run container   │   │   │
│  │ │ • Error handling     │   │      │ │ • Stream logs     │   │   │
│  │ │ • Message parsing    │   │      │ │ • Cleanup         │   │   │
│  │ └──────────────────────┘   │      │ └───────────────────┘   │   │
│  └────────────┬────────────────┘      └────────────┬──────────┘   │
│               │                                     │               │
│               │◄──────── HTTP + SSE ───────────────│               │
│               │                                     │               │
└───────────────┼─────────────────────────────────────┼───────────────┘
                │                                     │
                ↓                                     ↓
         Web Browser              Docker Daemon (Unix Socket)
           (Port 3000)                   (Port 2375)
```

---

## 📊 Component Interaction Diagram

```
User Input (GitHub URL)
    │
    ↓
┌─────────────────────┐
│ Frontend            │
│ RepositoryInput.js  │─→ Validates URL format
└─────────┬───────────┘
          │
          ↓
┌─────────────────────┐
│ API Service         │─→ Opens EventSource connection
│ api.js              │   to /run endpoint
└─────────┬───────────┘
          │
          ↓  HTTP POST
┌─────────────────────────────┐
│ Backend Express Server       │
│ index.js                    │
│ ├─ Validate URL             │
│ └─ Setup SSE stream         │
└─────────┬───────────────────┘
          │
          ↓
┌─────────────────────────────┐
│ Project Runner Service       │
│ projectRunner.js            │
│ ├─ Clone repository         │
│ ├─ Get project path         │
│ └─ Detect type              │
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│ Project Detector Service     │
│ projectDetector.js          │
│ ├─ Check for package.json   │
│ ├─ Check for requirements   │
│ ├─ Check for pom.xml        │
│ └─ Extract version info     │
└──────────┬──────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Docker Service               │
│ dockerService.js             │
│ ├─ Build container command   │
│ ├─ Spawn Docker process      │
│ ├─ Stream stdout/stderr      │
│ ├─ Handle timeouts           │
│ └─ Send SSE messages         │
└──────────┬───────────────────┘
           │
           ↓  Spawns Process
┌──────────────────────────────┐
│ Docker Container             │
│ (Isolated Environment)       │
│ ├─ node:18-alpine (Node.js)  │
│ ├─ python:3.11-slim (Python) │
│ └─ openjdk:17-slim (Java)    │
│                              │
│ ├─ Install dependencies      │
│ ├─ Run project               │
│ └─ Stream logs               │
└──────────┬───────────────────┘
           │ Stdout/Stderr
           ↓
┌──────────────────────────────┐
│ Docker Service Captures Logs  │
│ (SSE Message Formatting)     │
└──────────┬───────────────────┘
           │ SSE Events
           ↓
┌──────────────────────────────┐
│ Frontend Terminal Component   │
│ (Display in Browser)         │
│ ├─ Real-time log display     │
│ ├─ Color coding (error/warn) │
│ └─ Auto-scroll               │
└──────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
Browser Request:
{
  "url": "https://github.com/user/repo",
  "branch": "main"
}
    │
    ↓
Backend /run Endpoint (SSE)
    │
    ├─→ emit: {"status": "started", "id": "abc123"}
    │
    ├─→ Git Clone
    │   ├─ Simple-git library
    │   ├─ Clone to temp directory
    │   └─ emit: {"status": "progress", "message": "Cloning..."}
    │
    ├─→ Detect Project Type
    │   ├─ Check package.json → Node.js
    │   ├─ Check requirements.txt → Python
    │   ├─ Check pom.xml/build.gradle → Java
    │   └─ emit: {"status": "progress", "message": "Detected Node.js"}
    │
    ├─→ Docker Execution
    │   ├─ Select image (node:18-alpine)
    │   ├─ Mount volume
    │   ├─ Set resource limits
    │   ├─ Run container
    │   │  ├─ Install dependencies
    │   │  ├─ Run project
    │   │  └─ Capture output
    │   │
    │   ├─→ emit: {"status": "output", "message": "npm install..."}
    │   ├─→ emit: {"status": "output", "message": "starting..."}
    │   │
    │   └─ Wait for completion
    │
    ├─→ Cleanup
    │   ├─ Stop container
    │   ├─ Remove container
    │   ├─ Delete temp files
    │   └─ emit: {"status": "progress", "message": "Cleanup..."}
    │
    └─→ emit: {"status": "completed"}
```

---

## 🐳 Docker Execution Flow

```
┌──────────────────────────────────────────────────┐
│  Docker Daemon                                   │
│                                                  │
│  docker run --rm \                               │
│    --name github-runner-abc123 \                 │
│    -m=512m \                                     │
│    --cpus=1 \                                    │
│    -v /path/to/project:/app \                    │
│    -w /app \                                     │
│    node:18-alpine \                              │
│    bash -c "npm install && npm start"            │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Container Process                        │   │
│  │                                          │   │
│  │ 1. Extract project files (mounted)       │   │
│  │ 2. npm install                           │   │
│  │    ├─ Download packages                  │   │
│  │    ├─ Install locally                    │   │
│  │    └─ Output: "added XXX packages"       │   │
│  │ 3. npm start                             │   │
│  │    ├─ Run project scripts                │   │
│  │    ├─ Output: logs and metrics           │   │
│  │    └─ Timeout or completion              │   │
│  │ 4. Exit (container auto-removed)         │   │
│  │                                          │   │
│  │ Resource Limits:                         │   │
│  │ ├─ Memory: 512MB                         │   │
│  │ ├─ CPU: 1 core                           │   │
│  │ ├─ Timeout: 600s                         │   │
│  │ └─ No network                            │   │
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│           │ Stdout/Stderr                        │
│           ↓                                      │
│  ┌──────────────────────────────────────────┐   │
│  │ Output Capture                           │   │
│  │                                          │   │
│  │ $ npm install                            │   │
│  │ npm WARN using --force...                │   │
│  │ added 123 packages in 45s                │   │
│  │                                          │   │
│  │ $ npm start                              │   │
│  │ > project@1.0.0 start                    │   │
│  │ Running on http://localhost:3000         │   │
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│           │ Streamed                             │
│           ↓                                      │
└───────────────────────────────────────────────────┘
            │ Output lines
            ↓
    ┌───────────────────────┐
    │ Backend Docker Service │
    │ (Capture + Format)    │
    └───────────┬───────────┘
                │ SSE Events
                ↓
    ┌───────────────────────┐
    │ Frontend Terminal      │
    │ (Display in Browser)  │
    └───────────────────────┘
```

---

## 📡 Server-Sent Events (SSE) Message Flow

```
Client Opens Connection to /run
    │
    ↓
┌─────────────────────────────────┐
│ Server Sends Initial Message    │
│ data: {                         │
│   "status": "started",          │
│   "id": "abc123",               │
│   "message": "Starting..."      │
│ }                               │
└─────────────────────────────────┘
    │ \n\n (SSE separator)
    ↓
┌─────────────────────────────────┐
│ Server Sends Progress Update    │
│ data: {                         │
│   "status": "progress",         │
│   "message": "Cloning repo..."  │
│ }                               │
└─────────────────────────────────┘
    │ \n\n
    ↓
┌─────────────────────────────────┐
│ Server Sends Output Lines       │
│ data: {                         │
│   "status": "output",           │
│   "message": "npm install..."   │
│ }                               │
└─────────────────────────────────┘
    │ \n\n
    ↓
┌─────────────────────────────────┐
│ Server Sends More Output        │
│ data: {                         │
│   "status": "output",           │
│   "message": "added 123 pkgs"   │
│ }                               │
└─────────────────────────────────┘
    │ \n\n
    ↓
┌─────────────────────────────────┐
│ Server Sends Completion         │
│ data: {                         │
│   "status": "completed",        │
│   "message": "Finished!"        │
│ }                               │
└─────────────────────────────────┘
    │
    ↓
Client Connection Closes
```

---

## 🔐 Security Architecture

```
┌──────────────────────────────────────────┐
│         Security Layers                  │
│                                          │
│  Layer 1: Input Validation               │
│  ├─ GitHub URL format check              │
│  ├─ Branch name validation               │
│  └─ Prevent injection attacks            │
│                                          │
│  Layer 2: Network Isolation              │
│  ├─ Container network bridge mode        │
│  ├─ No internet access to containers     │
│  └─ Only mounted volumes accessible      │
│                                          │
│  Layer 3: Resource Limits                │
│  ├─ Memory limit: 512MB                  │
│  ├─ CPU limit: 1 core                    │
│  ├─ Timeout: 10 minutes                  │
│  └─ Prevent DOS attacks                  │
│                                          │
│  Layer 4: File System Isolation          │
│  ├─ Only project volume mounted          │
│ │ ├─ Read-only host filesystem           │
│  ├─ Temp files auto-deleted              │
│  └─ No persistent storage                │
│                                          │
│  Layer 5: Container Cleanup              │
│  ├─ --rm flag removes on exit            │
│  ├─ No privileged mode                   │
│  ├─ Automatic resource deallocation      │
│  └─ No container escape possible         │
│                                          │
│  Layer 6: Process Isolation              │
│  ├─ Separate UID/GID                     │
│  ├─ No signal handling                   │
│  └─ Kill process on timeout              │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📈 Deployment Topology

```
Development Environment:
┌────────┐  ┌────────┐  ┌────────┐
│Browser │─→│Frontend│─→│Backend │───┐
└────────┘  │:3000   │  │:5000   │   │
            └────────┘  └────────┘   │
                                     ↓
                              ┌──────────────┐
                              │Docker Daemon │
                              │ (localhost)  │
                              └──────────────┘

Production Deployment (Docker Compose):
┌──────────────────────────────────────┐
│    Docker Compose Network            │
│                                      │
│  ┌────────────┐      ┌──────────┐   │
│  │Frontend    │      │Backend   │   │
│  │nginx:3000  │─────→│node:5000 │   │
│  └────────────┘      └────┬─────┘   │
│                           │         │
│                           ↓         │
│                    ┌──────────────┐ │
│                    │Docker Daemon │ │
│                    └──────────────┘ │
│                                     │
└─────────────────────────────────────┘
      ↓
    Port 3000 (Frontend)
    Port 5000 (Backend)
```

---

## 🎯 Project Detection Logic

```
Clone Repository
    │
    ↓
Check for package.json?
    ├─ YES → Node.js Project
    │        Install: npm install
    │        Run: npm start
    │        Image: node:18-alpine
    │
    └─ NO
       ↓
       Check for requirements.txt?
           ├─ YES → Python Project
           │        Install: pip install -r requirements.txt
           │        Run: python main.py
           │        Image: python:3.11-slim
           │
           └─ NO
              ↓
              Check for pom.xml or build.gradle?
                  ├─ YES → Java Project
                  │        Install: mvn clean compile
                  │        Run: mvn exec:java
                  │        Image: openjdk:17-slim
                  │
                  └─ NO
                     ↓
                     Unknown Project
                     Image: ubuntu:22.04
                     Manual: Not automated
```

---

## ⚡ Performance Considerations

```
Frontend Performance:
├─ Initial Load: 2-3 seconds
├─ Component Rendering: <100ms
├─ SSE Connection: Real-time
└─ Memory Usage: 30-50 MB

Backend Performance:
├─ Server Startup: 1-2 seconds
├─ API Response: <100ms
├─ Docker Overhead: ~5 seconds
└─ Memory Usage: 50-100 MB

Project Execution:
├─ Git Clone: 5-30 seconds (size dependent)
├─ Type Detection: <1 second
├─ Dependency Install: 10-60 seconds
├─ Project Run: Variable
└─ Total Time: 30 seconds - 10+ minutes

Resource Limits (per container):
├─ Memory: 512 MB
├─ CPU: 1 core
├─ Disk: 5 GB (default)
└─ Timeout: 600 seconds
```

---

This architecture document provides a complete visual representation of how the GitHub Project Runner system is structured and how data flows through each component.
