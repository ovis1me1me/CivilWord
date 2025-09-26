# app/models/reply.py
'''
민원에 대한 답변 정보를 저장하는 모델

- 하나의 민원(Complaint)에 대해 생성된 답변을 저장
- 내용(content)은 JSONB 형식으로 저장되어 LLM 기반 응답의 구조적 정보까지 보관 가능
- 작성자 식별은 user_uid(FK)로 연결되며, 로그인한 사용자와 매칭됨
- 하나의 답변은 사용자의 선택 여부에 따라 UserReplyHistory와 연결될 수 있음
- 하나의 민원에 여러 답변이 연결될 수 있음 (1:N 구조)

주요 용도:
- 답변 생성(generation), 수정, 조회 API에서 활용
- 유저가 확정한 답변을 기록하거나 추후 다시 불러올 때 기준이 되는 데이터
'''

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base

class Reply(Base):
    __tablename__ = "reply"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaint.id"))
    content = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    #uid 추가
    user_uid = Column(String, ForeignKey("user.user_uid"), index=True)
    user = relationship("User", back_populates="replies")

    complaint = relationship("Complaint", back_populates="replies")  # Complaint 모델과의 관계 설정
    history = relationship("UserReplyHistory", back_populates="reply", cascade="all, delete-orphan")

    # rating: 1,2,3만 허용
    rating = Column(Integer, nullable=True)