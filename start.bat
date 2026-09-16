@echo off
echo ========================================================
echo   Starting KrishiVision AI Monorepo System
echo ========================================================
echo.

echo [1/3] Checking Python Dependencies & Seeding Demo Data...
cd backend
python -m pip install -r requirements.txt
python ../data/seeds/seed_demo_data.py
cd ..

echo.
echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "KrishiVision Backend" cmd /k "cd backend && python main.py"

echo.
echo [3/3] Starting React 19 Frontend on http://localhost:5173 ...
cd frontend
call npm install
call npm run dev
cd ..

echo.
echo [SUCCESS] KrishiVision AI Application Launched!
pause
