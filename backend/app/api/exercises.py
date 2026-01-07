from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
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

@router.get("/export", response_class=PlainTextResponse)
def export_logs(start_date: str, end_date: str, service: ExerciseService = Depends(get_exercise_service)):
    content = service.export_logs(start_date, end_date)
    if not content:
        raise HTTPException(status_code=404, detail="No logs found in range")
    return content

@router.get("/logs/{date}", response_model=Optional[ExerciseLog])
def get_log(date: str, service: ExerciseService = Depends(get_exercise_service)):
    log = service.get_log(date)
    if not log:
        # Return None (null) instead of 404 to avoid errors in logs
        return None
    return {"date": date, "data": log}

@router.post("/logs/{date}", response_model=ExerciseLog)
def save_log(date: str, log_data: Dict[str, Any], service: ExerciseService = Depends(get_exercise_service)):
    # log_data is expected to be the 'data' part (dict of exercises)
    service.save_log(date, log_data)
    return {"date": date, "data": log_data}
