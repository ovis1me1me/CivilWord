from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import complaint, user_info, login, register

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프론트 도메인으로 변경 가능
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB 테이블 생성
Base.metadata.create_all(bind=engine)

# 라우터 등록
app.include_router(complaint.router)
app.include_router(user_info.router)
app.include_router(login.router)
app.include_router(register.router)

# 루트 엔드포인트
@app.get("/")
def root():
    return {"message": "DB 및 백엔드 정상 작동 중.."}

# 인증된 사용자 정보 테스트 (선택)
from fastapi import Depends
from app.auth import get_current_user

@app.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user_uid": current_user["sub"]}
