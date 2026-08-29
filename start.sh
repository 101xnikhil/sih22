#!/usr/bin/env bash
# ==============================================================================
# LANDGUARD AI — One-Click Launcher (Clean Ports & Start Both Servers)
# ==============================================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================================================"
echo "  🚀 STARTING LANDGUARD AI MISSION CONTROL"
echo "================================================================================"

# 1. Clean up any stale background processes on ports 8000, 8001, and 5173
echo "• Cleaning up existing processes on ports 8000, 8001, and 5173..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# 2. Start FastAPI Backend in background
echo "• Starting FastAPI Backend on http://127.0.0.1:8000..."
if [ -d "$PROJECT_ROOT/venv" ]; then
  source "$PROJECT_ROOT/venv/bin/activate"
elif [ -d "$PROJECT_ROOT/backend/.venv" ]; then
  source "$PROJECT_ROOT/backend/.venv/bin/activate"
fi
cd "$PROJECT_ROOT/backend"
PYTHONPATH="$PROJECT_ROOT:$PROJECT_ROOT/backend" python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend health check
sleep 2
echo "• Backend Health: $(curl -s http://127.0.0.1:8000/api/health || echo 'Starting...')"

# 3. Start React Frontend with clean cache
echo "• Starting React Frontend on http://localhost:5173..."
cd "$PROJECT_ROOT/frontend"
rm -rf node_modules/.vite 2>/dev/null || true
npm run dev -- --port 5173 --force --host &
FRONTEND_PID=$!

echo ""
echo "================================================================================"
echo "  ✅ LANDGUARD AI IS RUNNING!"
echo "================================================================================"
echo "  👉 Dashboard UI:  http://localhost:5173"
echo "  👉 Backend API:   http://127.0.0.1:8000/docs"
echo "  👉 Health Check:  http://127.0.0.1:8000/api/health"
echo "================================================================================"
echo "  Press Ctrl+C to stop both servers."
echo ""

# Handle clean shutdown
trap "kill -9 $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" INT TERM
wait
