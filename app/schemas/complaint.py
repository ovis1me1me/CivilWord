from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ComplaintCreate(BaseModel):
    user_id: str
    title: str
    content: str
    urgency: Optional[int] = 0 #default 0


class ComplaintResponse(BaseModel):
    id: int
    user_id: str
    title: str
    content: str
    urgency: int
    created_at: datetime

    class Config:
        orm_mode = True #SQLAlchemy 모델을자동 변환 가능하게 함

class ComplaintSummaryResponse(BaseModel):
    summary: str

    class Config:
        orm_mode = True