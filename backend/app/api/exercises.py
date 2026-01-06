from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from ..schemas.schemas import ExerciseConfigItem, ExerciseLog, ExerciseLogCreate
from ..services.exercise_service import ExerciseService
from ..db.database import get_db, DBManager
from ..db.crud import ExerciseCRUD

router = APIRouter()

def get_exercise_service(db: DBManager = Depends(get_db)):
    return ExerciseService(ExerciseCRUD(db))

@router.get("/config", response_model=List[ExerciseConfigItem])
def get_config(service: ExerciseService = Depends(get_exercise_service)):
    return service.get_config()

@router.post("/config", response_model=List[ExerciseConfigItem])
def update_config(config: List[Dict[str, Any]], service: ExerciseService = Depends(get_exercise_service)):
    return service.update_config(config)

@router.get("/logs", response_model=List[ExerciseLog])
def get_all_logs(service: ExerciseService = Depends(get_exercise_service)):
    return service.get_all_logs()

@router.get("/logs/{date}", response_model=Optional[ExerciseLog])
def get_log(date: str, service: ExerciseService = Depends(get_exercise_service)):
    log = service.get_log(date)
    if not log:
        # Return empty log structure instead of 404 to be friendly to frontend?
        # Or let frontend handle 404. Let's return null/None which creates 200 with null body or 404.
        # Returning None usually makes Pydantic unhappy if response_model expects data.
        # Let's return 404.
        raise HTTPException(status_code=404, detail="Log not found")
    return {"date": date, "data": log}

@router.post("/logs/{date}", response_model=ExerciseLog)
def save_log(date: str, log_data: Dict[str, Any], service: ExerciseService = Depends(get_exercise_service)):
    # log_data is expected to be the 'data' part (dict of exercises)
    service.save_log(date, log_data)
    return {"date": date, "data": log_data}
