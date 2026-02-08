# Multi-stage Dockerfile for running different project types

# Stage 1: Node.js projects
FROM node:18-alpine as nodejs-executor
WORKDIR /app
COPY . .
RUN npm install --production
CMD ["npm", "start"]

# Stage 2: Python projects
FROM python:3.11-slim as python-executor
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "main.py"]

# Stage 3: Java projects
FROM openjdk:17-slim as java-executor
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
CMD ["mvn", "exec:java"]

# Default: Generic Ubuntu image
FROM ubuntu:22.04 as default
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*
CMD ["/bin/bash"]
