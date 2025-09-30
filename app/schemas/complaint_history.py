# app/schemas/complaint_history.py
'''
✅ 민원 히스토리 관련 응답 스키마 정의

1. ComplaintHistoryResponse
    - 히스토리 민원 전체 정보를 담는 응답 모델
    - 사용자의 고유 식별자(user_uid)와 함께, 제목, 본문, 요약, 답변 요지 및 본문 포함
    - moved_at 필드로 민원이 히스토리로 이동된 시점까지 추적 가능
    - reply_summary, reply_content는 JSON 구조를 그대로 포함

2. HistorySimpleContent
    - 히스토리 상세 조회 시, 핵심 정보만 간단히 응답하는 모델
    - 제목(title), 본문(content), 답변(reply_content)만 반환

3. ReplyBase
    - 특정 민원에 대한 답변 정보를 요약하여 응답하는 공통 스키마
    - 민원 ID(complaint_id), 생성 시각(created_at), 답변 내용 포함
    - 추후 재사용을 위해 공통 reply 관련 응답 스키마로 활용 가능

공통 설정:
- orm_mode = True: SQLAlchemy 모델에서 자동 변환 가능
'''


from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class ComplaintHistoryResponse(BaseModel):
    id: int
    user_uid: Optional[str]
    title: str
    content: str
    is_public: bool
    created_at: datetime
    summary: Optional[str]         
    reply_summary: Optional[Any] 
    reply_status: str
    reply_content: Optional[Any] 
    moved_at: Optional[datetime] = None
    rating: Optional[int] = None

    class Config:
        orm_mode = True

class HistorySimpleContent(BaseModel):
    title: str
    content: str
    reply_content: Optional[Any]

    class Config:
        orm_mode = True


class ReplyBase(BaseModel):
    id: int
    complaint_id: int
    created_at: datetime
    title: str
    summary: str
    content: str
