from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class UserReplyHistory(Base):
    __tablename__ = "user_reply_history"

    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("user.id"), index=True)  # 외래 키 추가
    reply_id = Column(Integer, ForeignKey("reply.id"))  # 답변의 ID
    
    final_content = Column(Text)  # 확정된 답변 내용
    used_at = Column(DateTime, default=datetime.utcnow)  # 답변 사용 시각

    # 관계 설정
    reply = relationship("Reply", back_populates="history")  # Reply 모델과 연결
    user = relationship("User", back_populates="reply_history")  # User 모델과 연결
