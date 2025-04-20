from pydantic import BaseModel
from typing import Optional

# 회원가입 요청용 (로그인 정보만)
class UserCreate(BaseModel):
    user_id: str       # 사용자가 입력하는 로그인 ID
    password: str

    class Config:
        orm_mode = True

# 사용자 추가 정보 입력용
class UserInfoCreate(BaseModel):
    name: str
    department: Optional[str] = None
    contact: Optional[str] = None

    class Config:
        orm_mode = True

# 회원가입 통합 요청용
class RegisterUserRequest(BaseModel):
    user: UserCreate
    user_info: UserInfoCreate

# 로그인 요청용
class UserLogin(BaseModel):
    user_id: str
    password: str

    class Config:
        orm_mode = True

# 로그인 응답용
class Token(BaseModel):
    access_token: str
    token_type: str
