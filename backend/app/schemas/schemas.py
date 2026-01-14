from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

# --- Daily Records ---

class DailyRecordBase(BaseModel):
    date: str
    time_of_day: str
    pain_level: int = 0
    dizziness_level: int = 0
    stomach_level: int = 0
    throat_level: int = 0
    dry_eye_level: int = 0
    fatigue_level: int = 0
    mood_level: int = 0
    body_feeling_note: str = ""
    sleep_note: str = ""
    daily_activity_note: str = ""
    pain_increasing_activities: str = ""
    pain_decreasing_activities: str = ""
    dizziness_increasing_activities: str = ""
    dizziness_decreasing_activities: str = ""
    medication_used: bool = False
    medication_note: str = ""
    notes: Dict[str, str] = {}
    triggers: Dict[str, str] = {}
    interventions: Dict[str, str] = {}

class DailyRecordCreate(DailyRecordBase):
    pass

class DailyRecord(DailyRecordBase):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class DailySummaryBase(BaseModel):
    date: str
    stomach_level: int = 0
    throat_level: int = 0
    dry_eye_level: int = 0
    fatigue_level: int = 0
    sleep_note: str = ""
    daily_activity_note: str = ""
    pain_increasing_activities: str = ""
    pain_decreasing_activities: str = ""
    dizziness_increasing_activities: str = ""
    dizziness_decreasing_activities: str = ""
    medication_used: bool = False
    medication_note: str = ""
    notes: Dict[str, str] = {}
    triggers: Dict[str, str] = {}
    interventions: Dict[str, str] = {}

class DailySummaryCreate(DailySummaryBase):
    pass

class DailySummary(DailySummaryBase):
    created_at: Optional[str] = None

# --- Exercises ---

class ExerciseConfigItem(BaseModel):
    id: str
    name: str
    enabled: bool = True
    order: int = 99

class ExerciseLogItem(BaseModel):
    id: str
    name: str
    status: str
    feedback: str = ""

class ExerciseLogBase(BaseModel):
    date: str
    data: Dict[str, ExerciseLogItem] # Key is exercise ID

class ExerciseLogCreate(BaseModel):
    date: str
    data: Dict[str, Any] # Flexible input, will validate content

class ExerciseLog(BaseModel):
    date: str
    data: Dict[str, Any]
    created_at: Optional[str] = None

class SymptomTrendPoint(BaseModel):
    datetime: str
    date: str
    time_of_day: str
    score: int
    symptom_name: str
