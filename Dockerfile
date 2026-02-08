# Multi-stage build for GitHub Project Runner
# Stage 1: Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Stage 2: Build and run backend with nginx
FROM node:18-alpine
WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx curl git bash

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm ci --production

# Copy backend code
COPY backend/ ./

# Create temp directory
RUN mkdir -p /app/temp-projects /var/log/nginx /var/run/nginx

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend build to nginx
RUN mkdir -p /usr/share/nginx/html
COPY --from=frontend-builder /app/frontend/build/ /usr/share/nginx/html/

# Verify frontend files exist
RUN ls -la /usr/share/nginx/html/ && echo "✓ Frontend files copied successfully"

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start both services
CMD ["sh", "-c", "echo 'Starting nginx and backend...' && nginx -g 'daemon off;' & npm start"]


