from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 민원 생성용 - user_uid는 서버 내부에서 처리하므로 필요 없음
class ComplaintCreate(BaseModel):
    title: str
    content: str
    urgency: Optional[int] = 0
    is_public: Optional[bool] = False

# 민원 조회 응답용
class ComplaintResponse(BaseModel):
    id: int
    user_uid: str
    title: str
    content: str
    urgency: int
    is_public: bool
    created_at: datetime

    class Config:
        orm_mode = True

# 민원 요약 응답용
class ComplaintSummaryResponse(BaseModel):
    summary: str

    class Config:
        orm_mode = True
