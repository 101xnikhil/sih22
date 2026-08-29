#!/usr/bin/env python3
"""
LANDGUARD AI — SQLite Database Inspector & CLI Summary Viewer
Usage: python3 tools/db_summary.py
"""
import sqlite3
import os
import sys
from datetime import datetime

# Check possible DB paths
POSSIBLE_PATHS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "landguard.db")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "landguard.db")),
]

DB_PATH = None
for p in POSSIBLE_PATHS:
    if os.path.exists(p):
        DB_PATH = p
        break

if not DB_PATH:
    DB_PATH = POSSIBLE_PATHS[0]


def inspect_db():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        sys.exit(1)

    print(f"\n=========================================================================================")
    print(f"🛡️  LANDGUARD AI — SQLite Database Inspector & Live Data Viewer")
    print(f"📍 Database File: {DB_PATH}")
    print(f"💾 File Size: {os.path.getsize(DB_PATH) / 1024:.1f} KB")
    print(f"⏰ Inspection Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"=========================================================================================\n")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"📋 Database Tables ({len(tables)}): {', '.join(tables)}\n")

    # 2. Table Record Counts
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            count = cursor.fetchone()[0]
            print(f"  • {table.ljust(22)} : {count} records")
        except Exception as e:
            print(f"  • {table.ljust(22)} : [Error: {e}]")

    # 3. RBAC Users & Credentials
    if "users" in tables:
        print(f"\n👤 Registered Authorization Users (RBAC):")
        print(f"{'-'*89}")
        try:
            cursor.execute("SELECT id, username, role, full_name, is_active FROM users ORDER BY id ASC;")
            rows = cursor.fetchall()
            print(f"{'ID':<4} | {'Username':<14} | {'Role':<12} | {'Active':<8} | {'Full Name':<30}")
            print(f"{'-'*89}")
            for r in rows:
                print(f"{r[0]:<4} | {r[1]:<14} | {r[2].upper():<12} | {'YES' if r[4] else 'NO':<8} | {str(r[3]):<30}")
        except Exception as e:
            print(f"Could not query users: {e}")

    # 4. Monitored Nodes
    if "nodes" in tables:
        print(f"\n🛰️ Monitored Sensor Nodes:")
        print(f"{'-'*89}")
        try:
            cursor.execute("SELECT node_id, name, status, last_seen FROM nodes;")
            rows = cursor.fetchall()
            for r in rows:
                print(f"  • Node ID: {r[0]} | Name: {r[1]} | Status: {r[2]} | Last Seen: {r[3]}")
        except Exception as e:
            print(f"Could not query nodes: {e}")

    # 5. Recent Telemetry
    if "telemetry_readings" in tables:
        print(f"\n📡 Recent Telemetry Records (Latest 5 Ingests):")
        print(f"{'-'*89}")
        try:
            cursor.execute("""
                SELECT id, node_id, timestamp, soil_moisture, rainfall, tilt_angle, battery, rssi 
                FROM telemetry_readings 
                ORDER BY id DESC LIMIT 5;
            """)
            rows = cursor.fetchall()
            print(f"{'ID':<6} | {'Node':<8} | {'Timestamp':<25} | {'Moisture %':<12} | {'Rain %':<8} | {'Tilt (deg)':<10} | {'Battery %':<10}")
            print(f"{'-'*89}")
            for r in rows:
                print(f"{r[0]:<6} | {str(r[1]):<8} | {str(r[2])[:23]:<25} | {str(r[3]):<12} | {str(r[4]):<8} | {str(r[5]):<10} | {str(r[6]):<10}")
        except Exception as e:
            print(f"Could not query telemetry: {e}")

    # 6. Recent Risk Assessments
    if "risk_assessments" in tables:
        print(f"\n🧠 Recent AI & Limit Equilibrium Risk Computations (Latest 5):")
        print(f"{'-'*89}")
        try:
            cursor.execute("""
                SELECT id, node_id, factor_of_safety, risk_score, risk_level, confidence, timestamp 
                FROM risk_assessments 
                ORDER BY id DESC LIMIT 5;
            """)
            rows = cursor.fetchall()
            print(f"{'ID':<6} | {'Node':<8} | {'Bishop FoS':<12} | {'Hazard %':<10} | {'Risk Tier':<12} | {'Confidence %':<12}")
            print(f"{'-'*89}")
            for r in rows:
                print(f"{r[0]:<6} | {str(r[1]):<8} | {f'{r[2]:.2f}':<12} | {f'{r[3]*100:.1f}%':<10} | {str(r[4]):<12} | {f'{r[5]*100:.0f}%':<12}")
        except Exception as e:
            print(f"Could not query risk assessments: {e}")

    # 7. Recent Alerts
    if "alerts" in tables:
        print(f"\n🚨 Active & Historic Emergency Alerts (Latest 5):")
        print(f"{'-'*89}")
        try:
            cursor.execute("""
                SELECT id, node_id, severity, title, acknowledged, timestamp 
                FROM alerts 
                ORDER BY id DESC LIMIT 5;
            """)
            rows = cursor.fetchall()
            print(f"{'ID':<6} | {'Node':<8} | {'Severity':<10} | {'Title':<30} | {'Ack':<6} | {'Timestamp':<20}")
            print(f"{'-'*89}")
            for r in rows:
                print(f"{r[0]:<6} | {str(r[1]):<8} | {str(r[2]):<10} | {str(r[3])[:28]:<30} | {str(r[4]):<6} | {str(r[5])[:19]:<20}")
        except Exception as e:
            print(f"Could not query alerts: {e}")

    conn.close()
    print(f"\n{'='*89}")
    print(f"💡 Interactive FastAPI Swagger Docs: Visit http://127.0.0.1:8000/docs")
    print(f"💡 Redoc API Documentation:         Visit http://127.0.0.1:8000/redoc")
    print(f"💡 SQLite Database File Location:   {DB_PATH}")
    print(f"{'='*89}\n")


if __name__ == "__main__":
    inspect_db()
