from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Complaint(Base):
    __tablename__ = "complaint"

    id = Column(Integer, primary_key=True, index=True)  # 내부 PK
    user_uid = Column(String, ForeignKey("user.user_uid"), index=True)  # 외부 식별자 (JWT sub 기준)
    
    title = Column(String)  # 민원 요약 제목
    content = Column(Text)  # 민원 본문
    urgency = Column(Integer)  # 긴급도 점수 (0~5)
    created_at = Column(DateTime, default=datetime.utcnow)
    reply_summary = Column(Text, nullable=True)  # 답변 요지
    tone = Column(String, nullable=True)  # 어조

    replies = relationship("Reply", back_populates="complaint")
    user = relationship("User", back_populates="complaints")
