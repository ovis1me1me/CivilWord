from pydantic import BaseModel
from datetime import datetime

class ReplyBase(BaseModel):
    complaint_id: int
    content: str
    created_at: datetime

    class Config:
        orm_mode = True
