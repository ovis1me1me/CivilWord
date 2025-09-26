# app/models/complaint_history.py
'''
답변 완료된 민원을 보관하는 히스토리 모델

- 사용자가 민원을 등록하고 답변이 완료되면, 해당 민원을 별도 테이블에 보관
- 실제 민원 테이블(complaint)에서 삭제되고 이 테이블로 이동
- 사용자 식별자(user_uid) 기준으로 소유자 구분 가능
- 공개 여부(is_public)에 따라 다른 사용자에게도 추천 대상으로 활용 가능
- 요약(reply_summary) 및 답변(reply_content)은 JSON 구조로 저장
- moved_at 필드를 통해 이동 시점 추적 가능

※ 민원 통계, 유사 답변 추천, 아카이빙 등에 사용됨
'''

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base

class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(Integer, primary_key=True, index=True)  # PK
    user_uid = Column(String, ForeignKey("user.user_uid"), index=True)
    
    title = Column(String) 
    content = Column(Text)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text, nullable=True)
    reply_summary = Column(JSONB, nullable=True)  #  JSONB로 변경
    reply_content = Column(JSONB, nullable=True)  #  JSONB로 변경
    reply_status = Column(String, default="답변전")

    moved_at = Column(DateTime, default=datetime.utcnow) 

    # rating: 1,2,3만 허용
    rating = Column(Integer, nullable=True)