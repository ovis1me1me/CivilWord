from pydantic import BaseModel
from datetime import datetime

class ReplyBase(BaseModel):
    id:int
    complaint_id: int
    content: str
    created_at: datetime

    class Config:
        orm_mode = True

class SimpleContent(BaseModel):
    content: str