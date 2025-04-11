from sqlalchemy import Column, Integer, String
from app.database import Base

class UserInfo(Base):
    __tablename__ = "user_info"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, unique=True)  # 유니크로 설정
    name = Column(String)
    department = Column(String)
    contact = Column(String)
    category = Column(String)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.id is not None and self.user_id:
            raise ValueError("Cannot modify user_id once set")
