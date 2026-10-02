@echo off
echo ===================================================
echo   Starting Kitchen OS - Intelligent Food Management
echo ===================================================
echo.

start "Kitchen OS Backend (FastAPI)" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --port 8000"
start "Kitchen OS Frontend (React)" cmd /k "cd frontend && npm run dev"

echo.
echo Kitchen OS services launched!
echo - Frontend: http://localhost:3000
echo - Backend API ^& Swagger: http://localhost:8000/docs
echo.
