from fastapi import APIRouter, Depends
from typing import Optional
from ..schemas.schemas import DailySummary, DailySummaryCreate
from ..db.database import get_db, DBManager
from ..db.crud import RecordCRUD

router = APIRouter()

def get_crud(db: DBManager = Depends(get_db)):
    return RecordCRUD(db)

@router.get("/{date}", response_model=Optional[DailySummary])
def get_summary(date: str, crud: RecordCRUD = Depends(get_crud)):
    return crud.get_summary(date)

@router.post("/", response_model=DailySummary)
def upsert_summary(summary: DailySummaryCreate, crud: RecordCRUD = Depends(get_crud)):
    crud.upsert_summary(summary.model_dump())
    return crud.get_summary(summary.date)

