# app/schemas/reply_history.py
'''
✅ 사용자 답변 선택 히스토리 응답 스키마

1. UserReplyHistoryResponse
    - 사용자가 최종 선택한 답변 정보를 반환하는 모델
    - reply_id를 통해 어떤 답변(Reply)을 선택했는지 추적
    - final_content는 선택된 답변 내용을 JSON 구조로 포함
    - used_at은 사용 시각을 자동 기록하여 정렬, 분석 등에 활용 가능

용도:
- `/user-history/replies` API 등에서 사용자 선택 이력을 확인할 때 사용
- 향후 유사도 검색, 추천 기반 기능에서 중요한 피드백 데이터 역할

공통 설정:
- `orm_mode = True`로 SQLAlchemy ORM 모델과 자동 변환 가능
'''


from pydantic import BaseModel
from datetime import datetime
from typing import Any 

class UserReplyHistoryResponse(BaseModel):
    id: int
    reply_id: int
    final_content: Any
    used_at: datetime

    class Config:
        orm_mode = True
