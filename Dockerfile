# Multi-stage build for GitHub Project Runner

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend . 
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend .

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Install git (needed for git clone)
RUN apk add --no-cache git

# Copy backend from build stage
COPY --from=backend-build /app/backend ./backend

# Copy frontend build output to backend public directory
RUN mkdir -p backend/public
COPY --from=frontend-build /app/frontend/build ./backend/public

WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
