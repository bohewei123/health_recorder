import sqlite3
import pandas as pd
import json
from datetime import datetime

class DBManager:
    def __init__(self, db_path="health_records.db"):
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
        except (json.JSONDecodeError, TypeError):
            # Fallback for legacy text data
            return {"General": data}

    def add_record(self, date, time_of_day, symptoms, notes, triggers, interventions):
        """
        symptoms: dict containing score for each symptom
        notes, triggers, interventions: dict containing details per symptom
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Serialize details
        notes_json = self._ensure_json(notes)
        triggers_json = self._ensure_json(triggers)
        interventions_json = self._ensure_json(interventions)
        
        cursor.execute('''
            SELECT id FROM daily_records WHERE date = ? AND time_of_day = ?
        ''', (date, time_of_day))
        result = cursor.fetchone()
        
        if result:
            # Update existing
            cursor.execute('''
                UPDATE daily_records SET
                    pain_level = ?,
                    dizziness_level = ?,
                    stomach_level = ?,
                    throat_level = ?,
                    dry_eye_level = ?,
                    fatigue_level = ?,
                    notes = ?,
                    triggers = ?,
                    interventions = ?
                WHERE id = ?
            ''', (
                symptoms.get('pain_level', 0),
                symptoms.get('dizziness_level', 0),
                symptoms.get('stomach_level', 0),
                symptoms.get('throat_level', 0),
                symptoms.get('dry_eye_level', 0),
                symptoms.get('fatigue_level', 0),
                notes_json,
                triggers_json,
                interventions_json,
                result[0]
            ))
        else:
            # Insert new
            cursor.execute('''
                INSERT INTO daily_records (
                    date, time_of_day, pain_level, dizziness_level, stomach_level,
                    throat_level, dry_eye_level, fatigue_level, notes, triggers, interventions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                date, time_of_day,
                symptoms.get('pain_level', 0),
                symptoms.get('dizziness_level', 0),
                symptoms.get('stomach_level', 0),
                symptoms.get('throat_level', 0),
                symptoms.get('dry_eye_level', 0),
                symptoms.get('fatigue_level', 0),
                notes_json,
                triggers_json,
                interventions_json
            ))
        
        conn.commit()
        conn.close()

    # Exercise Management Methods
    def get_exercise_config(self):
        """Get the current exercise configuration."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT value FROM exercise_config WHERE key = "exercise_list"')
        result = cursor.fetchone()
        conn.close()
        return self._parse_json(result[0]) if result else []

    def save_exercise_config(self, exercises):
        """Save exercise configuration list."""
        conn = self.get_connection()
        cursor = conn.cursor()
        data_json = self._ensure_json(exercises)
        cursor.execute('''
            INSERT OR REPLACE INTO exercise_config (key, value)
            VALUES ("exercise_list", ?)
        ''', (data_json,))
        conn.commit()
        conn.close()

    def get_exercise_log(self, date_str):
        """Get exercise log for a specific date."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT data FROM exercise_logs WHERE date = ?', (date_str,))
        result = cursor.fetchone()
        conn.close()
        return self._parse_json(result[0]) if result else None

    def save_exercise_log(self, date_str, data):
        """Save exercise log for a specific date."""
        conn = self.get_connection()
        cursor = conn.cursor()
        data_json = self._ensure_json(data)
        cursor.execute('''
            INSERT OR REPLACE INTO exercise_logs (date, data, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        ''', (date_str, data_json))
        conn.commit()
        conn.close()

    def get_all_exercise_logs(self):
        """Get all exercise logs with dates."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT date, data FROM exercise_logs ORDER BY date DESC')
        results = cursor.fetchall()
        conn.close()
        return [{'date': r[0], 'data': self._parse_json(r[1])} for r in results]

    def delete_exercise_log(self, date_str):
        """Delete exercise log for a specific date."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM exercise_logs WHERE date = ?', (date_str,))
        conn.commit()
        conn.close()

    def get_all_records(self):
        conn = self.get_connection()
        df = pd.read_sql_query("SELECT * FROM daily_records ORDER BY date DESC, created_at DESC", conn)
        conn.close()
        return df

    def get_record(self, date, time_of_day):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM daily_records WHERE date = ? AND time_of_day = ?", (date, time_of_day))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            # Convert to dict
            columns = [description[0] for description in cursor.description]
            record = dict(zip(columns, row))
            
            # Parse JSON fields
            record['notes'] = self._parse_json(record.get('notes'))
            record['triggers'] = self._parse_json(record.get('triggers'))
            record['interventions'] = self._parse_json(record.get('interventions'))
            
            return record
        return None

    def delete_record(self, record_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM daily_records WHERE id = ?", (record_id,))
        conn.commit()
        conn.close()
