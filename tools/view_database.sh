#!/bin/bash
# LANDGUARD AI — Launch Web GUI SQLite Database Viewer

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="$ROOT_DIR/landguard.db"

echo "======================================================="
echo "🛡️  LANDGUARD AI — Web GUI Database Viewer Launcher"
echo "📍 Database: $DB_PATH"
echo "======================================================="

if [ ! -f "$DB_PATH" ]; then
    echo "⚠️  Database file not found. Starting backend to initialize schema..."
    cd "$ROOT_DIR"
    ./venv/bin/python3 -c "from backend.app.database import init_db; init_db()"
fi

if [ -f "$ROOT_DIR/venv/bin/sqlite_web" ]; then
    echo "🚀 Starting SQLite Web GUI on http://127.0.0.1:8080 ..."
    echo "💡 Press Ctrl+C to stop."
    "$ROOT_DIR/venv/bin/sqlite_web" "$DB_PATH" --port 8080 --no-browser
else
    echo "📦 sqlite-web not found in venv. Running CLI inspector..."
    "$ROOT_DIR/venv/bin/python3" "$SCRIPT_DIR/db_summary.py"
fi
