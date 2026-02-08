# Multi-stage build for GitHub Project Runner
# Stage 1: Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Stage 2: Build backend and final image
FROM node:18-alpine
WORKDIR /app

# Install system dependencies including nginx
RUN apk add --no-cache git bash nginx curl

# Copy backend files and install dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Create temp directory for cloned projects
RUN mkdir -p /app/temp-projects

# Copy frontend build from stage 1
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Make sure nginx.conf is correct
RUN cat /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start services
CMD ["/app/start.sh"]

