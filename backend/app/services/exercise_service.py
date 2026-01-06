import uuid
import re
import os
from ..db.crud import ExerciseCRUD
from ..schemas.schemas import ExerciseConfigItem

TEMPLATE_PATH = "exercise_template.md"

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
