import uuid
import re
import os
from ..db.crud import ExerciseCRUD
from ..schemas.schemas import ExerciseConfigItem

TEMPLATE_PATH = "exercise_template.md"

from datetime import datetime

class ExerciseService:
    def __init__(self, crud: ExerciseCRUD):
        self.crud = crud

    def parse_exercise_template(self, file_path=TEMPLATE_PATH):
        """Parse the markdown template to extract exercise names."""
        if not os.path.exists(file_path):
            return []
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            exercises = []
            # Regex to find lines like "## 1、Name"
            matches = re.findall(r'##\s*\d+[、\.]\s*(.+)', content)
            
            for idx, name in enumerate(matches):
                exercises.append({
                    "id": str(uuid.uuid4()),
                    "name": name.strip(),
                    "enabled": True,
                    "order": idx
                })
            return exercises
        except Exception as e:
            print(f"Error reading template: {e}")
            return []

    def init_exercise_config(self):
        """Initialize exercise config if not exists."""
        config = self.crud.get_exercise_config()
        if not config:
            initial_exercises = self.parse_exercise_template()
            if initial_exercises:
                self.crud.save_exercise_config(initial_exercises)
                return initial_exercises
        return config

    def get_config(self):
        return self.init_exercise_config()

    def update_config(self, new_config: list):
        # Ensure IDs and defaults
        for item in new_config:
            if not item.get('id'):
                item['id'] = str(uuid.uuid4())
            if 'enabled' not in item:
                item['enabled'] = True
            if 'order' not in item:
                item['order'] = 99
        self.crud.save_exercise_config(new_config)
        return new_config

    def get_log(self, date_str: str):
        return self.crud.get_exercise_log(date_str)

    def save_log(self, date_str: str, data: dict):
        self.crud.save_exercise_log(date_str, data)
        return data

    def get_all_logs(self):
        return self.crud.get_all_exercise_logs()

    def export_logs(self, start_date: str, end_date: str) -> str:
        """Generate markdown export for exercise logs within date range."""
        all_logs = self.crud.get_all_exercise_logs()
        config = self.get_config()
        
        # Parse dates
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Filter logs
        filtered_logs = [
            l for l in all_logs 
            if start <= datetime.strptime(l['date'], '%Y-%m-%d').date() <= end
        ]
        
        if not filtered_logs:
            return ""
            
        # Create a map of id -> order
        order_map = {item['id']: item.get('order', 999) for item in config}
        
        md_output = ""
        # Sort logs by date (oldest to newest for export usually makes sense, or keep desc? Original was implicit loop order)
        # Original logic: `for log in filtered_logs:` where all_logs came from DB desc. 
        # Let's sort by date ascending for better reading in doc.
        filtered_logs.sort(key=lambda x: x['date'])

        for log in filtered_logs:
            md_output += f"# {log['date']} 训练反馈\n\n"
            data = log['data']
            
            # Convert log dict to list
            log_items = []
            for eid, info in data.items():
                log_items.append({
                    "id": eid,
                    "name": info.get('name', 'Unknown'),
                    "status": info.get('status', ''),
                    "feedback": info.get('feedback', '')
                })
            
            # Sort items by config order
            log_items.sort(key=lambda x: order_map.get(x['id'], 999))
            
            for i, item in enumerate(log_items, 1):
                md_output += f"## {i}、{item['name']}\n"
                md_output += f"**状态**: {item['status']}\n\n"
                if item['feedback']:
                    md_output += f"{item['feedback']}\n\n"
                else:
                    md_output += "\n"
            
            md_output += "---\n\n"
            
        return md_output
