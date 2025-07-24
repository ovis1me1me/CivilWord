# app/models/user_info.py
'''
사용자의 상세 정보를 저장하는 모델

- 기본 계정 정보(User) 외에 이름, 부서, 연락처, 이메일 등 추가 인적 정보를 관리
- user_uid(ForeignKey)를 통해 User 테이블과 1:1 연결됨 (unique 제약)
- 실명 기반 민원처리, 부서 기반 안내문, 연락처 기반 민원 안내 등 다양한 답변 생성에 활용
- 한번 등록된 user_uid는 수정 불가능 (초기 생성 이후 고정)
- FastAPI 라우터에서 등록/수정/조회 API를 통해 접근

※ 민원 자동응답 생성 시, 담당자 서명 정보로 활용됨
'''


from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class UserInfo(Base):
    __tablename__ = "user_info"

    id = Column(Integer, primary_key=True, index=True)  # 내부 PK
    user_uid = Column(String, ForeignKey("user.user_uid"), unique=True, index=True)  # 외부 ID 참조

    name = Column(String)         # 실명 or 닉네임
    department = Column(String)   # 부서
    contact = Column(String)      # 연락처
    email = Column(String)      # 이메일

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.id is not None and self.user_uid:
            raise ValueError("Cannot modify user_uid once set")
