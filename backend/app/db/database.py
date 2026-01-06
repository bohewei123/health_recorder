import sqlite3
import json
import os

DB_PATH = "health_records.db"

class DBManager:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                time_of_day TEXT NOT NULL,
                pain_level INTEGER,
                dizziness_level INTEGER,
                stomach_level INTEGER,
                throat_level INTEGER,
                dry_eye_level INTEGER,
                fatigue_level INTEGER,
                notes TEXT,
                triggers TEXT,
                interventions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Exercise Configuration Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exercise_config (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')
        
        # Exercise Logs Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exercise_logs (
                date TEXT PRIMARY KEY,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()

    def _ensure_json(self, data):
        """Convert dict/list to JSON string. If string, return as is."""
        if isinstance(data, (dict, list)):
            return json.dumps(data, ensure_ascii=False)
        return data

    def _parse_json(self, data):
        """Try to parse JSON string. If fails, return as string or wrapped in dict."""
        if not data:
            return {}
        try:
            parsed = json.loads(data)
            if isinstance(parsed, (dict, list)):
                return parsed
            # If parsed but not a dict (e.g. "some string"), wrap it
            return {"General": parsed if parsed else data}
        except (json.JSONDecodeError, TypeError) as e:
            # Fallback for legacy text data
            print(f"Error parsing JSON: {e}, data: {data}")
            return {"General": data}

db_manager = DBManager()

def get_db():
    return db_manager
