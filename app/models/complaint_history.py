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

#유사민원 라우터에서 같이 반환 민원요지, 답변