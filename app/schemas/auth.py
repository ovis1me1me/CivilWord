from pydantic import BaseModel

# 회원가입 요청용
class UserCreate(BaseModel):
    user_id: str       # 사용자가 입력하는 로그인 ID
    password: str
    name: str          # 실명 or 닉네임

    class Config:
        orm_mode = True

# 로그인 요청용
class UserLogin(BaseModel):
    user_id: str       # 로그인용 ID (username → user_id로 변경)
    password: str

    class Config:
        orm_mode = True

# 로그인 응답용
class Token(BaseModel):
    access_token: str
    token_type: str
