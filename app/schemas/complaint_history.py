from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ComplaintHistoryResponse(BaseModel):
    id: int
    user_uid: Optional[str]
    title: str
    content: str
    is_public: bool
    created_at: datetime
    summary: Optional[str]         
    reply_summary: Optional[str] 
    reply_status: str
    reply_content: Optional[str] 
    moved_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class HistorySimpleContent(BaseModel):
    title: str
    content: str
    reply_content: Optional[str]

    class Config:
        orm_mode = True