from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 민원 생성용 - user_uid는 서버 내부에서 처리하므로 필요 없음
class ComplaintCreate(BaseModel):
    title: str
    content: str
    is_public: Optional[bool] = False

# 민원 조회 응답용
class ComplaintResponse(BaseModel):
    id: int
    user_uid: str
    title: str
    content: str
    is_public: bool
    created_at: datetime
    summary: Optional[str] = None         
    reply_summary: Optional[str] = None   
    reply_status: str

    class Config:
        orm_mode = True

# 민원 요약 응답용
class ComplaintSummaryResponse(BaseModel):
    summary: str

    class Config:
        orm_mode = True

class ReplyStatusUpdateRequest(BaseModel):
    status: str  # '답변전', '수정중', '답변완료' 중 하나여야 함