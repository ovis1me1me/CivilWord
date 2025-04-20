from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_uid = Column(String, unique=True, index=True)  # JWT sub에 들어가는 값
    user_id = Column(String, unique=True)               # 로그인 ID (입력값)
    name = Column(String)                               # 닉네임 or 실명
    hashed_password = Column(String)
    
    complaints = relationship("Complaint", back_populates="user")  # Relationship with Complaint
    reply_history = relationship("UserReplyHistory", back_populates="user")  # Relationship with UserReplyHistory
