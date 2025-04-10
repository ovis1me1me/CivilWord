from sqlalchemy import Column, Integer, String
from app.database import Base
class UserInfo(Base):
    __tablename__ = "user_info"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, unique=True)    #더미 사용자 id(로그인 이후 대체)
    name = Column(String)
    department = Column(String)
    contact = Column(String)
    category = Column(String)

