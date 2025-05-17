# app/schemas/user.py
from pydantic import BaseModel

class FindUserIdRequest(BaseModel):
    name: str
    email: str
    contact: str


class FindUserIdResponse(BaseModel):
    user_id: str

class FindQuestionRequest(BaseModel):
    user_id: str

class FindQuestionResponse(BaseModel):
    question: str

class VerifyAnswerRequest(BaseModel):
    user_id: str
    answer: str

class VerifyAnswerResponse(BaseModel):
    password: str
