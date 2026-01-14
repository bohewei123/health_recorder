from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from io import BytesIO
from typing import List, Optional
from ..schemas.schemas import DailyRecord, DailyRecordCreate
from ..services.record_service import RecordService
from ..db.database import get_db, DBManager
from ..db.crud import RecordCRUD
from ..services.record_excel_export import build_health_records_workbook

router = APIRouter()

def get_record_service(db: DBManager = Depends(get_db)):
    return RecordService(RecordCRUD(db))

@router.get("/", response_model=List[DailyRecord])
def get_all_records(service: RecordService = Depends(get_record_service)):
    return service.get_all_records()

@router.get("/export_excel")
def export_excel(start_date: str, end_date: str, db: DBManager = Depends(get_db)):
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    if end < start:
        start, end = end, start

    dates = []
    cur = start
    while cur <= end:
        dates.append(cur.strftime("%Y-%m-%d"))
        cur += timedelta(days=1)

    crud = RecordCRUD(db)
    records = crud.get_records_in_range(start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
    summaries_by_date = crud.get_summaries_for_dates(dates)

    content = build_health_records_workbook(
        start.strftime("%Y-%m-%d"),
        end.strftime("%Y-%m-%d"),
        records,
        summaries_by_date
    )

    filename = f"health_records_{start.strftime('%Y%m%d')}_{end.strftime('%Y%m%d')}.xlsx"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

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
