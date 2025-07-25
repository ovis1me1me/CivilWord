# app/schemas/reply.py
'''
✅ 답변(Reply) 관련 응답 스키마 정의

1. ReplyBase
    - 민원에 대한 단일 답변 정보를 표현
    - 답변 본문(content)은 JSON 구조로 저장되며, 생성 시각(created_at) 포함
    - 주로 답변 조회, 답변 목록, 관리자 응답 검토 등에 사용

2. SimpleContent
    - 단일 content 필드만 필요한 간단한 응답용 구조
    - 예: 유사 민원 검색 결과에서 본문만 반환할 때 활용

3. Section
    - 하나의 요약 항목을 구성하는 단위 구조
    - title(소제목)과 text(본문 설명)으로 구성
    - 요약 결과나 응답 생성 시 내부 JSON 구조 일부로 활용

공통 설정:
- `orm_mode = True`: ORM 모델과 자동 변환 가능
'''


from pydantic import BaseModel
from datetime import datetime
from typing import Any,List

class ReplyBase(BaseModel):
    id:int
    complaint_id: int
    content: Any
    created_at: datetime

    class Config:
        orm_mode = True

class SimpleContent(BaseModel):
    content: Any

class Section(BaseModel):
    title: str
    text: str
