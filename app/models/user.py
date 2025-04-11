from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    
    complaints = relationship("Complaint", back_populates="user")  # Relationship with Complaint
    reply_history = relationship("UserReplyHistory", back_populates="user")  # Relationship with UserReplyHistory
