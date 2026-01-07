from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..schemas.schemas import DailyRecord, DailyRecordCreate
from ..services.record_service import RecordService
from ..db.database import get_db, DBManager
from ..db.crud import RecordCRUD

router = APIRouter()

def get_record_service(db: DBManager = Depends(get_db)):
    return RecordService(RecordCRUD(db))

@router.get("/", response_model=List[DailyRecord])
def get_all_records(service: RecordService = Depends(get_record_service)):
    return service.get_all_records()

@router.get("/{date}/{time_of_day}", response_model=Optional[DailyRecord])
def get_record(date: str, time_of_day: str, service: RecordService = Depends(get_record_service)):
    record = service.get_record(date, time_of_day)
    # Return None (null) instead of 404 if not found, to avoid errors in logs for routine checks
    return record

@router.post("/", response_model=DailyRecord)
def create_record(record: DailyRecordCreate, service: RecordService = Depends(get_record_service)):
    return service.create_or_update_record(record)

@router.delete("/{record_id}")
def delete_record(record_id: int, service: RecordService = Depends(get_record_service)):
    service.delete_record(record_id)
    return {"status": "success"}
