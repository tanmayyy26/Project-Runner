# Multi-stage build for GitHub Project Runner
# Stage 1: Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend and final image
FROM node:18-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git bash nginx

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ ./

# Create temp directory for cloned projects
RUN mkdir -p /app/temp-projects

# Copy frontend build from stage 1
COPY --from=frontend-builder /app/frontend/build /app/frontend-build

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Set up nginx to serve frontend
RUN mkdir -p /usr/share/nginx/html && \
    cp -r /app/frontend-build/* /usr/share/nginx/html/

# Expose port (Render maps PORT env var to this)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start both nginx and backend
CMD ["sh", "-c", "nginx -g 'daemon off;' & npm start"]

