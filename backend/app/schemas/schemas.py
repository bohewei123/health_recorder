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
