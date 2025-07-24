# app/schemas/complaint.py
'''
✅ 민원(Complaint) 관련 요청 및 응답 스키마 정의

1. ComplaintCreate
    - 민원 등록 시 사용되는 요청 모델
    - user_uid는 인증 사용자로부터 추출되므로 요청 본문에는 포함하지 않음

2. ComplaintResponse
    - 단일 민원 조회 응답 모델
    - 민원 본문, 요약, 답변 상태 등 포함

3. ComplaintListResponse
    - 민원 목록 조회 시, 전체 개수(total)와 민원 리스트(complaints)를 반환

4. ComplaintSummaryResponse
    - 민원 내용 요약 결과 반환
    - 기존 content와 함께 summary 포함

5. ReplyStatusUpdateRequest
    - 민원 처리 상태('답변전', '수정중', '답변완료') 변경 요청용

6. FullReplySummaryResponse
    - 답변 요약 전체 구조 반환 (요약 리스트, 선택된 요약 포함)

7. ReplySummaryUpdateRequest / ReplySummaryRequest
    - 답변 요약 저장 또는 수정 요청 시 사용
    - JSON 구조의 summary 데이터 송수신 처리

8. Section, AnswerSummaryItem
    - 요약 항목 구성에 사용되는 내부 구조 모델
    - Section은 단일 제목/텍스트, AnswerSummaryItem은 여러 section을 포함하는 블록

공통 설정:
- 모든 응답 모델에 `orm_mode = True` 설정 → SQLAlchemy 모델과 자동 매핑 가능
'''


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