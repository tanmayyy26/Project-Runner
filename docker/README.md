# GitHub Project Runner Docker

This directory contains Dockerfiles and orchestration scripts for running the backend and frontend in isolated containers.

## Files
- Dockerfile: Multi-stage build for production
- Dockerfile.backend: Backend container
- Dockerfile.frontend: Frontend container
- docker-compose.yml: Orchestrates all services
- nginx.conf: Reverse proxy configuration

## Usage

1. Ensure Docker and Docker Compose are installed.
2. Build and start all services:
   ```bash
   docker-compose up --build
   ```
3. Access the frontend at [http://localhost](http://localhost)

## Troubleshooting
- Ensure Docker Compose is installed and in PATH
- Check logs for errors
- Containers auto-cleanup after project run

## License
MIT
