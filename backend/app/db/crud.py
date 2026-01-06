from .database import DBManager
import pandas as pd

class RecordCRUD:
    def __init__(self, db_manager: DBManager):
        self.db = db_manager

    def add_record(self, record_data: dict):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        # Serialize details
        notes_json = self.db._ensure_json(record_data.get('notes', {}))
        triggers_json = self.db._ensure_json(record_data.get('triggers', {}))
        interventions_json = self.db._ensure_json(record_data.get('interventions', {}))
        
        cursor.execute('''
            SELECT id FROM daily_records WHERE date = ? AND time_of_day = ?
        ''', (record_data['date'], record_data['time_of_day']))
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
                record_data.get('pain_level', 0),
                record_data.get('dizziness_level', 0),
                record_data.get('stomach_level', 0),
                record_data.get('throat_level', 0),
                record_data.get('dry_eye_level', 0),
                record_data.get('fatigue_level', 0),
                notes_json,
                triggers_json,
                interventions_json,
                result[0]
            ))
            record_id = result[0]
        else:
            # Insert new
            cursor.execute('''
                INSERT INTO daily_records (
                    date, time_of_day, pain_level, dizziness_level, stomach_level,
                    throat_level, dry_eye_level, fatigue_level, notes, triggers, interventions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                record_data['date'], record_data['time_of_day'],
                record_data.get('pain_level', 0),
                record_data.get('dizziness_level', 0),
                record_data.get('stomach_level', 0),
                record_data.get('throat_level', 0),
                record_data.get('dry_eye_level', 0),
                record_data.get('fatigue_level', 0),
                notes_json,
                triggers_json,
                interventions_json
            ))
            record_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        return record_id

    def get_record(self, date, time_of_day):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM daily_records WHERE date = ? AND time_of_day = ?", (date, time_of_day))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            columns = [description[0] for description in cursor.description]
            record = dict(zip(columns, row))
            record['notes'] = self.db._parse_json(record.get('notes'))
            record['triggers'] = self.db._parse_json(record.get('triggers'))
            record['interventions'] = self.db._parse_json(record.get('interventions'))
            return record
        return None

    def get_all_records(self):
        conn = self.db.get_connection()
        # Using pandas here as in original, or convert to dict list
        # Returning list of dicts is better for API
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM daily_records ORDER BY date DESC, created_at DESC")
        rows = cursor.fetchall()
        columns = [description[0] for description in cursor.description]
        conn.close()
        
        results = []
        for row in rows:
            record = dict(zip(columns, row))
            record['notes'] = self.db._parse_json(record.get('notes'))
            record['triggers'] = self.db._parse_json(record.get('triggers'))
            record['interventions'] = self.db._parse_json(record.get('interventions'))
            results.append(record)
        return results

    def delete_record(self, record_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM daily_records WHERE id = ?", (record_id,))
        conn.commit()
        conn.close()

class ExerciseCRUD:
    def __init__(self, db_manager: DBManager):
        self.db = db_manager

    def get_exercise_config(self):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT value FROM exercise_config WHERE key = "exercise_list"')
        result = cursor.fetchone()
        conn.close()
        return self.db._parse_json(result[0]) if result else []

    def save_exercise_config(self, exercises):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        data_json = self.db._ensure_json(exercises)
        cursor.execute('''
            INSERT OR REPLACE INTO exercise_config (key, value)
            VALUES ("exercise_list", ?)
        ''', (data_json,))
        conn.commit()
        conn.close()

    def get_exercise_log(self, date_str):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT data FROM exercise_logs WHERE date = ?', (date_str,))
        result = cursor.fetchone()
        conn.close()
        return self.db._parse_json(result[0]) if result else None

    def save_exercise_log(self, date_str, data):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        data_json = self.db._ensure_json(data)
        cursor.execute('''
            INSERT OR REPLACE INTO exercise_logs (date, data, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        ''', (date_str, data_json))
        conn.commit()
        conn.close()

    def get_all_exercise_logs(self):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT date, data FROM exercise_logs ORDER BY date DESC')
        results = cursor.fetchall()
        conn.close()
        return [{'date': r[0], 'data': self.db._parse_json(r[1])} for r in results]

    def delete_exercise_log(self, date_str):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM exercise_logs WHERE date = ?', (date_str,))
        conn.commit()
        conn.close()
