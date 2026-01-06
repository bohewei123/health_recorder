from ..db.crud import RecordCRUD
from ..schemas.schemas import DailyRecordCreate

class RecordService:
    def __init__(self, crud: RecordCRUD):
        self.crud = crud

    def get_record(self, date: str, time_of_day: str):
        return self.crud.get_record(date, time_of_day)

    def create_or_update_record(self, record_data: DailyRecordCreate):
        # Convert Pydantic model to dict
        data = record_data.model_dump()
        self.crud.add_record(data)
        return self.get_record(data['date'], data['time_of_day'])

    def get_all_records(self):
        return self.crud.get_all_records()

    def delete_record(self, record_id: int):
        self.crud.delete_record(record_id)
