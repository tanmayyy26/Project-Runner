#!/bin/bash

# GitHub Project Runner - Cleanup Script
# Removes temporary files and cleans up Docker resources

set -e

echo "🧹 GitHub Project Runner Cleanup"
echo ""

# Remove temporary project directories
if [ -d "backend/temp-projects" ]; then
    echo "Removing temporary projects..."
    rm -rf backend/temp-projects
    echo "✅ Cleaned temporary projects"
fi

# Remove node_modules if requested
read -p "Remove node_modules? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing node_modules..."
    rm -rf backend/node_modules frontend/node_modules
    echo "✅ Cleaned node_modules"
fi

# Docker cleanup if available
if command -v docker &> /dev/null; then
    read -p "Clean Docker containers and images? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping Docker containers..."
        docker-compose -f docker/docker-compose.yml down 2>/dev/null || true
        echo "✅ Stopped Docker containers"
        
        read -p "Remove Docker images? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker rmi -f github-runner-backend github-runner-frontend 2>/dev/null || true
            echo "✅ Removed Docker images"
        fi
    fi
fi

echo ""
echo "🎉 Cleanup complete!"
