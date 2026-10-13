@echo off
echo =========================================================================
echo Starting SentinelX — Multi-Sector Digital Risk Protection Platform
echo =========================================================================

cd /d %~dp0

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "SentinelX Backend (FastAPI)" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173...
start "SentinelX Frontend (Vite)" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo =========================================================================
echo SentinelX services launched!
echo - Web Dashboard:  http://localhost:5173
echo - FastAPI REST:   http://127.0.0.1:8000
echo - Swagger Docs:   http://127.0.0.1:8000/docs
echo =========================================================================
pause
