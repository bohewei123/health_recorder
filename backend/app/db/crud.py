from .database import DBManager

class RecordCRUD:
    def __init__(self, db_manager: DBManager):
        self.db = db_manager
        self._record_defaults = {
            "pain_level": 0,
            "dizziness_level": 0,
            "mood_level": 0,
            "body_feeling_note": "",
            "stomach_level": 0,
            "throat_level": 0,
            "dry_eye_level": 0,
            "fatigue_level": 0,
            "sleep_note": "",
            "daily_activity_note": "",
            "pain_increasing_activities": "",
            "pain_decreasing_activities": "",
            "dizziness_increasing_activities": "",
            "dizziness_decreasing_activities": "",
            "medication_used": 0,
            "medication_note": "",
            "notes": {},
            "triggers": {},
            "interventions": {}
        }

    def _normalize_time_of_day(self, time_of_day: str) -> str:
        if time_of_day == "早起时":
            return "起床"
        if time_of_day == "中午":
            return "下午"
        return time_of_day

    def _time_of_day_aliases(self, time_of_day: str) -> list[str]:
        normalized = self._normalize_time_of_day(time_of_day)
        if normalized == "起床":
            return ["起床", "早起时"]
        if normalized == "下午":
            return ["下午", "中午"]
        return [normalized]

    def _get_existing_record_id(self, cursor, date: str, time_of_day: str):
        for candidate in self._time_of_day_aliases(time_of_day):
            cursor.execute(
                "SELECT id FROM daily_records WHERE date = ? AND time_of_day = ?",
                (date, candidate)
            )
            row = cursor.fetchone()
            if row:
                return row[0]
        return None

    def upsert_summary(self, summary_data: dict):
        conn = self.db.get_connection()
        cursor = conn.cursor()

        notes_json = self.db._ensure_json(summary_data.get("notes", {}))
        triggers_json = self.db._ensure_json(summary_data.get("triggers", {}))
        interventions_json = self.db._ensure_json(summary_data.get("interventions", {}))

        cursor.execute("SELECT date FROM daily_summaries WHERE date = ?", (summary_data["date"],))
        exists = cursor.fetchone()

        if exists:
            cursor.execute(
                """
                UPDATE daily_summaries SET
                    stomach_level = ?,
                    throat_level = ?,
                    dry_eye_level = ?,
                    fatigue_level = ?,
                    sleep_note = ?,
                    daily_activity_note = ?,
                    pain_increasing_activities = ?,
                    pain_decreasing_activities = ?,
                    dizziness_increasing_activities = ?,
                    dizziness_decreasing_activities = ?,
                    medication_used = ?,
                    medication_note = ?,
                    notes = ?,
                    triggers = ?,
                    interventions = ?
                WHERE date = ?
                """,
                (
                    summary_data.get("stomach_level", 0),
                    summary_data.get("throat_level", 0),
                    summary_data.get("dry_eye_level", 0),
                    summary_data.get("fatigue_level", 0),
                    summary_data.get("sleep_note", ""),
                    summary_data.get("daily_activity_note", ""),
                    summary_data.get("pain_increasing_activities", ""),
                    summary_data.get("pain_decreasing_activities", ""),
                    summary_data.get("dizziness_increasing_activities", ""),
                    summary_data.get("dizziness_decreasing_activities", ""),
                    int(summary_data.get("medication_used", False)),
                    summary_data.get("medication_note", ""),
                    notes_json,
                    triggers_json,
                    interventions_json,
                    summary_data["date"]
                )
            )
        else:
            cursor.execute(
                """
                INSERT INTO daily_summaries (
                    date,
                    stomach_level,
                    throat_level,
                    dry_eye_level,
                    fatigue_level,
                    sleep_note,
                    daily_activity_note,
                    pain_increasing_activities,
                    pain_decreasing_activities,
                    dizziness_increasing_activities,
                    dizziness_decreasing_activities,
                    medication_used,
                    medication_note,
                    notes,
                    triggers,
                    interventions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    summary_data["date"],
                    summary_data.get("stomach_level", 0),
                    summary_data.get("throat_level", 0),
                    summary_data.get("dry_eye_level", 0),
                    summary_data.get("fatigue_level", 0),
                    summary_data.get("sleep_note", ""),
                    summary_data.get("daily_activity_note", ""),
                    summary_data.get("pain_increasing_activities", ""),
                    summary_data.get("pain_decreasing_activities", ""),
                    summary_data.get("dizziness_increasing_activities", ""),
                    summary_data.get("dizziness_decreasing_activities", ""),
                    int(summary_data.get("medication_used", False)),
                    summary_data.get("medication_note", ""),
                    notes_json,
                    triggers_json,
                    interventions_json
                )
            )

        conn.commit()
        conn.close()

    def get_summary(self, date: str):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM daily_summaries WHERE date = ?", (date,))
        row = cursor.fetchone()
        columns = [description[0] for description in cursor.description]
        conn.close()

        if not row:
            return None

        summary = dict(zip(columns, row))
        summary["notes"] = self.db._parse_json(summary.get("notes"))
        summary["triggers"] = self.db._parse_json(summary.get("triggers"))
        summary["interventions"] = self.db._parse_json(summary.get("interventions"))
        return summary

    def get_summaries_for_dates(self, dates: list[str]) -> dict:
        if not dates:
            return {}
        conn = self.db.get_connection()
        cursor = conn.cursor()
        placeholders = ",".join(["?"] * len(dates))
        cursor.execute(f"SELECT * FROM daily_summaries WHERE date IN ({placeholders})", dates)
        rows = cursor.fetchall()
        columns = [description[0] for description in cursor.description]
        conn.close()

        result = {}
        for row in rows:
            summary = dict(zip(columns, row))
            summary["notes"] = self.db._parse_json(summary.get("notes"))
            summary["triggers"] = self.db._parse_json(summary.get("triggers"))
            summary["interventions"] = self.db._parse_json(summary.get("interventions"))
            result[summary["date"]] = summary
        return result

    def add_record(self, record_data: dict):
        conn = self.db.get_connection()
        cursor = conn.cursor()

        time_of_day = self._normalize_time_of_day(record_data["time_of_day"])

        summary_payload = {
            "date": record_data["date"],
            "stomach_level": record_data.get("stomach_level", 0),
            "throat_level": record_data.get("throat_level", 0),
            "dry_eye_level": record_data.get("dry_eye_level", 0),
            "fatigue_level": record_data.get("fatigue_level", 0),
            "sleep_note": record_data.get("sleep_note", ""),
            "daily_activity_note": record_data.get("daily_activity_note", ""),
            "pain_increasing_activities": record_data.get("pain_increasing_activities", ""),
            "pain_decreasing_activities": record_data.get("pain_decreasing_activities", ""),
            "dizziness_increasing_activities": record_data.get("dizziness_increasing_activities", ""),
            "dizziness_decreasing_activities": record_data.get("dizziness_decreasing_activities", ""),
            "medication_used": record_data.get("medication_used", False),
            "medication_note": record_data.get("medication_note", ""),
            "notes": record_data.get("notes", {}),
            "triggers": record_data.get("triggers", {}),
            "interventions": record_data.get("interventions", {})
        }
        self.upsert_summary(summary_payload)

        existing_id = self._get_existing_record_id(cursor, record_data["date"], time_of_day)

        if existing_id:
            cursor.execute(
                """
                UPDATE daily_records SET
                    time_of_day = ?,
                    pain_level = ?,
                    dizziness_level = ?,
                    mood_level = ?,
                    body_feeling_note = ?
                WHERE id = ?
                """,
                (
                    time_of_day,
                    record_data.get("pain_level", 0),
                    record_data.get("dizziness_level", 0),
                    record_data.get("mood_level", 0),
                    record_data.get("body_feeling_note", ""),
                    existing_id
                )
            )
            record_id = existing_id
        else:
            cursor.execute(
                """
                INSERT INTO daily_records (
                    date, time_of_day, pain_level, dizziness_level, mood_level, body_feeling_note
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    record_data["date"],
                    time_of_day,
                    record_data.get("pain_level", 0),
                    record_data.get("dizziness_level", 0),
                    record_data.get("mood_level", 0),
                    record_data.get("body_feeling_note", "")
                )
            )
            record_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        return record_id

    def get_record(self, date, time_of_day):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        normalized_time = self._normalize_time_of_day(time_of_day)
        row = None
        for candidate in self._time_of_day_aliases(normalized_time):
            cursor.execute("SELECT * FROM daily_records WHERE date = ? AND time_of_day = ?", (date, candidate))
            row = cursor.fetchone()
            if row:
                break
        if row:
            columns = [description[0] for description in cursor.description]
            record = dict(zip(columns, row))
            record["time_of_day"] = self._normalize_time_of_day(record.get("time_of_day"))
            record["notes"] = self.db._parse_json(record.get("notes"))
            record["triggers"] = self.db._parse_json(record.get("triggers"))
            record["interventions"] = self.db._parse_json(record.get("interventions"))
            if not record.get("body_feeling_note") and record.get("notes", {}).get("General"):
                record["body_feeling_note"] = record["notes"].get("General")

            summary = self.get_summary(date)
            if summary:
                for k, v in summary.items():
                    if k not in {"date", "created_at"}:
                        record[k] = v

            for k, v in self._record_defaults.items():
                if record.get(k) is None:
                    record[k] = v

            conn.close()
            return record
        conn.close()
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
            record["time_of_day"] = self._normalize_time_of_day(record.get("time_of_day"))
            record["notes"] = self.db._parse_json(record.get("notes"))
            record["triggers"] = self.db._parse_json(record.get("triggers"))
            record["interventions"] = self.db._parse_json(record.get("interventions"))
            if not record.get("body_feeling_note") and record.get("notes", {}).get("General"):
                record["body_feeling_note"] = record["notes"].get("General")
            results.append(record)
        
        summaries = self.get_summaries_for_dates(list({r["date"] for r in results if r.get("date")}))
        for record in results:
            summary = summaries.get(record.get("date"))
            if summary:
                for k, v in summary.items():
                    if k not in {"date", "created_at"}:
                        record[k] = v
            for k, v in self._record_defaults.items():
                if record.get(k) is None:
                    record[k] = v
        return results

    def get_records_in_range(self, start_date: str, end_date: str):
        start = start_date if start_date <= end_date else end_date
        end = end_date if start_date <= end_date else start_date

        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM daily_records WHERE date >= ? AND date <= ? ORDER BY date ASC, created_at ASC",
            (start, end)
        )
        rows = cursor.fetchall()
        columns = [description[0] for description in cursor.description]
        conn.close()

        results = []
        for row in rows:
            record = dict(zip(columns, row))
            record["time_of_day"] = self._normalize_time_of_day(record.get("time_of_day"))
            record["notes"] = self.db._parse_json(record.get("notes"))
            record["triggers"] = self.db._parse_json(record.get("triggers"))
            record["interventions"] = self.db._parse_json(record.get("interventions"))
            if not record.get("body_feeling_note") and record.get("notes", {}).get("General"):
                record["body_feeling_note"] = record["notes"].get("General")
            results.append(record)

        summaries = self.get_summaries_for_dates(list({r["date"] for r in results if r.get("date")}))
        for record in results:
            summary = summaries.get(record.get("date"))
            if summary:
                for k, v in summary.items():
                    if k not in {"date", "created_at"}:
                        record[k] = v
            for k, v in self._record_defaults.items():
                if record.get(k) is None:
                    record[k] = v

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
