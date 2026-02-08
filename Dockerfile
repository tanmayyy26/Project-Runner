# Multi-stage Dockerfile for GitHub Project Runner

# Build frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:18 AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm install
COPY backend/ ./

# Production image
FROM nginx:alpine AS production
WORKDIR /app
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html
COPY --from=backend-build /app/backend /app/backend
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80
EXPOSE 4000

# Start Nginx and backend
CMD ["sh", "-c", "nginx -g 'daemon off;' & cd /app/backend && npm start"]
