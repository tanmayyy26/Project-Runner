# Multi-stage build for GitHub Project Runner
# Stage 1: Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final image with backend only (Express will serve frontend)
FROM node:18-alpine
WORKDIR /app

# Install git and bash for project cloning
RUN apk add --no-cache git bash

# Copy backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy frontend build to backend's public folder
RUN mkdir -p ./public
COPY --from=frontend-builder /app/frontend/build ./public

# Create temp directory for cloned projects
RUN mkdir -p ./temp-projects

# Expose port (Render uses this)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start backend (which serves frontend as static files)
CMD ["npm", "start"]




