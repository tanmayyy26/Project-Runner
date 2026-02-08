#!/bin/bash

# GitHub Project Runner - Setup Script
# This script sets up the entire project

set -e

echo "╔═══════════════════════════════════════╗"
echo "║  GitHub Project Runner Setup Script   ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi
echo "✅ npm $(npm --version) found"

# Check Docker (optional)
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Docker execution will be disabled"
    DOCKER_ENABLED=false
else
    echo "✅ Docker $(docker --version | awk '{print $3}') found"
    DOCKER_ENABLED=true
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git"
    exit 1
fi
echo "✅ Git $(git --version | awk '{print $3}') found"

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies
echo "🔧 Backend..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "🔧 Frontend..."
cd frontend
npm install
cd ..

# Create .env file
echo ""
echo "⚙️  Creating environment configuration..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⏭️  backend/.env already exists (skipped)"
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║  Setup Complete! 🎉                   ║"
echo "╚═══════════════════════════════════════╝"
echo ""

echo "📋 Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd backend && npm start"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd frontend && npm start"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Or use Docker Compose:"
echo "   docker-compose -f docker/docker-compose.yml up"
echo ""
