from pydantic import BaseModel
from datetime import datetime
from typing import Any 

class ReplyBase(BaseModel):
    id:int
    complaint_id: int
    content: Any
    created_at: datetime

    class Config:
        orm_mode = True

class SimpleContent(BaseModel):
    content: Any