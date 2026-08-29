@echo off
echo Starting Label Generator Setup...
echo.

:: Check if Node.js is installed
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed on this PC!
    echo Please install Node.js from https://nodejs.org/ first.
    echo.
    pause
    exit /b
)

:: Install dependencies if node_modules is missing
IF NOT EXIST "node_modules\" (
    echo Installing dependencies (this only happens once)...
    call npm install
)

echo.
echo Starting the application...
call npm run start
