@echo off
echo ==========================================
echo Starting Voting Platform
echo ==========================================
echo.

echo Step 1: Setting execution policy...
powershell -Command "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force"

echo Step 2: Generating package-lock.json...
cd backend
cmd /c npm install
cd ..

echo Step 3: Building Docker images...
cd deployment
docker-compose stop
docker-compose rm -f
docker-compose build --no-cache

echo Step 4: Starting all services...
docker-compose up -d

echo Step 5: Waiting for services to start...
timeout /t 15 /nobreak

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Your app is now running at:
echo   - Frontend: http://localhost
echo   - API: http://localhost/api
echo   - HAProxy Stats: http://localhost:8404
echo.
echo To view logs: cd deployment ^&^& docker-compose logs -f
echo To stop: cd deployment ^&^& docker-compose down
echo.
pause
