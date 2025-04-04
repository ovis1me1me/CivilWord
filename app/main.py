from fastapi import FastAPI
from app.routers import ask

app = FastAPI() # FastAPI 앱 생성
app.include_router(ask.router)	# ask 라우터 등록

# 테스트용 핸들러
@app.get("/")
def root():
	return {"message": "새올 민원자동응답 시스템입니다."}
