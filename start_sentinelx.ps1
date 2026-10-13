# SentinelX PowerShell Start Script
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Starting SentinelX — Multi-Sector Digital Risk Protection Platform" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting React Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm.cmd run dev"

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "SentinelX running!" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:5173" -ForegroundColor Yellow
Write-Host "API:       http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Docs:      http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Cyan
