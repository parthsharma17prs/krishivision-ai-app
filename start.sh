#!/bin/bash
echo "========================================================"
echo "  Starting KrishiVision AI Monorepo System"
echo "========================================================"
echo ""

echo "[1/3] Installing Backend Dependencies & Seeding Data..."
cd backend
pip install -r requirements.txt
python ../data/seeds/seed_demo_data.py
cd ..

echo ""
echo "[2/3] Starting FastAPI Backend on http://localhost:8000 ..."
cd backend && python main.py &
BACKEND_PID=$!
cd ..

echo ""
echo "[3/3] Starting React 19 Frontend on http://localhost:5173 ..."
cd frontend
npm install
npm run dev
