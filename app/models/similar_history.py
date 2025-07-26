from sqlalchemy import Column, Integer, Text, ForeignKey, UniqueConstraint,String
from app.database import Base

class SimilarHistory(Base):
    __tablename__ = "similar_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaint.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    
