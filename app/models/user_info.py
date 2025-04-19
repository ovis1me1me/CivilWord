from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class UserInfo(Base):
    __tablename__ = "user_info"

    id = Column(Integer, primary_key=True, index=True)  # 내부 PK
    user_uid = Column(String, ForeignKey("user.user_uid"), unique=True, index=True)  # 외부 ID 참조

    name = Column(String)         # 실명 or 닉네임
    department = Column(String)   # 부서
    contact = Column(String)      # 연락처
    category = Column(String)     # 민원 분류

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.id is not None and self.user_uid:
            raise ValueError("Cannot modify user_uid once set")
