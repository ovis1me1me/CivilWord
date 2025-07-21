from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
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
    reply_summary = Column(Text, nullable=True)
    reply_status = Column(String, default="답변전")
    reply_content = Column(Text, nullable=True)  # 히스토리 답변 내용 저장용

    moved_at = Column(DateTime, default=datetime.utcnow) 