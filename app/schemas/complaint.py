from pydantic import BaseModel
from typing import List, Optional, Any
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
    reply_summary: Optional[Any] = None   
    reply_status: str

    class Config:
        orm_mode = True

class ComplaintListResponse(BaseModel):
    total: int
    complaints: List[ComplaintResponse]

# 민원 요약 응답용
class ComplaintSummaryResponse(BaseModel):
    title: str
    content: str
    summary: Any

    class Config:
        orm_mode = True

class ReplyStatusUpdateRequest(BaseModel):
    status: str  # '답변전', '수정중', '답변완료' 중 하나여야 함

class FullReplySummaryResponse(BaseModel):
    summary: Any  # ✅ 구조가 JSON이라면 수정
    selected_reply: Optional[Any] = None  # ✅ 단일 선택도 JSON 가능
    generated_replies: List[Any]  # ✅ 여러 개 생성 요약도 JSON 구조 예상 시

    class Config:
        orm_mode = True

# ✅ 답변 요지 수정용 request body
class ReplySummaryUpdateRequest(BaseModel):
    summary: Any

class Section(BaseModel):
    title: str
    text: str

class AnswerSummaryItem(BaseModel):
    index: str
    section: List[Section]
    

class ReplySummaryRequest(BaseModel):
    answer_summary: List[AnswerSummaryItem]