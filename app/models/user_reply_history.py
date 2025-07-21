from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base

class UserReplyHistory(Base):
    __tablename__ = "user_reply_history"

    id = Column(Integer, primary_key=True, index=True)

    user_uid = Column(String, ForeignKey("user.user_uid"), index=True)  # 외부 식별자 기준 연결
    reply_id = Column(Integer, ForeignKey("reply.id"))  # 답변 ID

    final_content = Column(JSONB)  # 확정된 답변 내용
    used_at = Column(DateTime, default=datetime.utcnow)  # 사용 시각

    # 관계 설정
    reply = relationship("Reply", back_populates="history")
    user = relationship("User", back_populates="reply_history")
