from pydantic import BaseModel

class ResponseMessage(BaseModel):
    message: str

    class Config:
        orm_mode = True  # ORM 모델을 자동으로 변환 가능하게 설정
