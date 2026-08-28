#!/usr/bin/env python3
"""
LANDGUARD AI — SQLite Database Inspector & CLI Summary Viewer
Usage: python3 tools/db_summary.py
"""
import sqlite3
import os
import sys
from datetime import datetime

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "landguard.db"))

def inspect_db():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        sys.exit(1)

    print(f"\n=======================================================")
    print(f"🛡️  LANDGUARD AI — SQLite Database Inspector")
    print(f"📍 Database File: {DB_PATH}")
    print(f"💾 Size: {os.path.getsize(DB_PATH) / 1024:.1f} KB")
    print(f"⏰ Inspection Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"=======================================================\n")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"📋 Registered Tables ({len(tables)}): {', '.join(tables)}\n")

    # 2. Table Counts
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            count = cursor.fetchone()[0]
            print(f"  • {table.ljust(20)} : {count} records")
        except Exception as e:
            print(f"  • {table.ljust(20)} : [Error: {e}]")

    # 3. Recent Telemetry
    if "telemetry" in tables:
        print(f"\n📡 Recent Telemetry Records (Latest 5):")
        print(f"{'-'*85}")
        try:
            cursor.execute("""
                SELECT id, node_id, timestamp, soil_moisture_pct, rainfall_pct, tilt_angle 
                FROM telemetry 
                ORDER BY id DESC LIMIT 5;
            """)
            rows = cursor.fetchall()
            print(f"{'ID':<6} | {'Node':<8} | {'Timestamp':<25} | {'Moisture %':<12} | {'Rain %':<8} | {'Tilt (deg)':<10}")
            print(f"{'-'*85}")
            for r in rows:
                print(f"{r[0]:<6} | {str(r[1]):<8} | {str(r[2]):<25} | {str(r[3]):<12} | {str(r[4]):<8} | {str(r[5]):<10}")
        except Exception as e:
            print(f"Could not query telemetry: {e}")

    # 4. Recent Alerts
    if "alerts" in tables:
        print(f"\n🚨 Active & Historic Alerts (Latest 5):")
        print(f"{'-'*85}")
        try:
            cursor.execute("""
                SELECT id, node_id, severity, risk_level, acknowledged, timestamp 
                FROM alerts 
                ORDER BY id DESC LIMIT 5;
            """)
            rows = cursor.fetchall()
            print(f"{'ID':<6} | {'Node':<8} | {'Severity':<10} | {'Risk Level':<12} | {'Ack':<6} | {'Timestamp':<25}")
            print(f"{'-'*85}")
            for r in rows:
                print(f"{r[0]:<6} | {str(r[1]):<8} | {str(r[2]):<10} | {str(r[3]):<12} | {str(r[4]):<6} | {str(r[5]):<25}")
        except Exception as e:
            print(f"Could not query alerts: {e}")

    # 5. Sensor Nodes
    if "sensor_nodes" in tables:
        print(f"\n🛰️ Monitored Sensor Nodes:")
        print(f"{'-'*85}")
        try:
            cursor.execute("SELECT id, name, status, last_seen FROM sensor_nodes;")
            rows = cursor.fetchall()
            for r in rows:
                print(f"  • ID: {r[0]} | Name: {r[1]} | Status: {r[2]} | Last Seen: {r[3]}")
        except Exception as e:
            print(f"Could not query sensor nodes: {e}")

    conn.close()
    print(f"\n{'='*85}")
    print(f"💡 Web GUI Database Viewer: Run './tools/view_database.sh' to open SQLite in browser!")
    print(f"💡 Interactive Swagger API: Visit http://127.0.0.1:8000/docs")
    print(f"{'='*85}\n")

if __name__ == "__main__":
    inspect_db()
