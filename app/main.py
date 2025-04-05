from fastapi import FastAPI
from app.routers import ask
from app.services.llm_service import generate_response
from pydantic import BaseModel

app = FastAPI() # FastAPI 앱 생성
app.include_router(ask.router)	# ask 라우터 등록


#   1. Pydantic 모델 정의
#   요청 스키마
class MessageRequest(BaseModel):
    message: str    #반드시 포함되어야 하는 필드

#   응답 스키마
class MessageResponse(BaseModel):
    you_sent: str


# 테스트용 핸들러
@app.get("/")
def root():
	return {"message": "새올 민원자동응답 시스템입니다."}

@app.post("/echo", response_model=MessageResponse)
def echo_message(data: MessageRequest):
    answer = generate_response(data.message)
    return {"you_sent": answer}
