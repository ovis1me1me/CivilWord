# 요청 및 응답 데이터 구조 정의

from pydantic import BaseModel

class AskRequest(BaseModel):
	query: str

class AskResponse(BaseModel):
	answer: str
