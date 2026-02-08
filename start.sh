#!/bin/bash

# GitHub Project Runner - Quick Start Script

set -e

echo "🚀 Starting GitHub Project Runner..."
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Using Docker Compose..."
    docker-compose -f docker/docker-compose.yml up
else
    echo "📦 Starting without Docker (local mode)..."
    echo ""
    
    # Start backend
    echo "🔧 Starting Backend Server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 3
    
    # Start frontend
    echo "⚛️  Starting Frontend..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo "✅ Services started!"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend: http://localhost:5000"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
fi
