from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Reply(Base):
    __tablename__ = "reply"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaint.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="replies")  # Complaint 모델과의 관계 설정
    history = relationship("UserReplyHistory", back_populates="reply", cascade="all, delete-orphan")