#!/bin/sh
# Startup script for GitHub Project Runner on Render

# Start nginx in background
echo "Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Wait for nginx to start
sleep 2

# Start Node backend
echo "Starting Node backend on port 5000..."
cd /app
exec npm start
