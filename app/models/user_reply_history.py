from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from datetime import datetime
from app.database import Base

class UserReplyHistory(Base):
    __tablename__ = "user_reply_history"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(String, index=True)  # 어떤 사용자가
    reply_id = Column(Integer, ForeignKey("reply.id"))  # 어떤 답변을

    final_content = Column(Text)  # 확정된 답변 내용
    used_at = Column(DateTime, default=datetime.utcnow)
