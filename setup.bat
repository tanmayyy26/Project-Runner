@echo off
REM GitHub Project Runner - Setup Script for Windows
REM This script sets up the entire project

echo.
echo ==============================================================
echo    GitHub Project Runner Setup Script (Windows)
echo ==============================================================
echo.

REM Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo OK - %%i

REM Check npm
echo [2/5] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found. Please install npm
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo OK - %%i

REM Check Docker (optional)
echo [3/5] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker not found. Docker execution will be disabled
    set DOCKER_ENABLED=false
) else (
    for /f "tokens=*" %%i in ('docker --version') do echo OK - %%i
    set DOCKER_ENABLED=true
)

REM Check Git
echo [4/5] Checking Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git not found. Please install Git
    exit /b 1
)
for /f "tokens=*" %%i in ('git --version') do echo OK - %%i

REM Install dependencies
echo.
echo [5/5] Installing dependencies...
echo.

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Create .env file
echo.
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo Created backend\.env
) else (
    echo backend\.env already exists (skipped)
)

echo.
echo ==============================================================
echo    Setup Complete!
echo ==============================================================
echo.
echo Next steps:
echo.
echo 1. Start the backend (Terminal 1):
echo    cd backend && npm start
echo.
echo 2. Start the frontend (Terminal 2):
echo    cd frontend && npm start
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
echo Or use Docker Compose:
echo    docker-compose -f docker\docker-compose.yml up
echo.

pause
