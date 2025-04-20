from pydantic import BaseModel

# 유저 상세 정보 등록/수정용
class UserInfoCreate(BaseModel):
    name: str
    department: str
    contact: str

# 유저 상세 정보 응답용
class UserInfoResponse(BaseModel):
    user_uid: str  # 응답에는 외부 식별자 포함 (user_uid)
    name: str
    department: str
    contact: str

    class Config:
        orm_mode = True
