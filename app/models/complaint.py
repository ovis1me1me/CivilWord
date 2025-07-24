# app/models/complaint.py
'''
민원 등록 및 관리용 메인 모델

- 사용자가 작성한 민원을 저장하며, 진행 중인 민원의 모든 상태를 관리
- JWT의 sub 값(user_uid)로 사용자와 연결됨
- 제목(title), 본문(content), 요약(summary), 답변 요지(reply_summary) 등의 정보를 포함
- reply_status로 현재 민원 처리 상태를 추적 ("답변전", "수정중", "답변완료" 등)
- is_public 필드를 통해 민원의 공개 여부 설정 가능
- 하나의 민원은 여러 개의 답변(Reply)과 연결될 수 있음 (1:N 관계)
- 최종 답변 후 해당 민원 다운로드 시, ComplaintHistory 테이블로 이동하고 이 테이블에서는 삭제됨

※ 실시간 민원 등록, 수정, 조회, 삭제 API에서 이 모델을 사용
'''

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base

class Complaint(Base):
    __tablename__ = "complaint"

    id = Column(Integer, primary_key=True, index=True)  # 내부 PK
    user_uid = Column(String, ForeignKey("user.user_uid"), index=True)  # 외부 식별자 (JWT sub 기준)
    
    title = Column(String)  # 민원 요약 제목
    content = Column(Text)  # 민원 본문
    is_public = Column(Boolean, default=False)   # 공개 여부
    created_at = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text, nullable=True)   # 민원 요지
    reply_summary = Column(JSONB, nullable=True)

    reply_status = Column(String, default="답변전") 
    
    replies = relationship("Reply", back_populates="complaint")
    user = relationship("User", back_populates="complaints")
