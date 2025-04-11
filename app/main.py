from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models #__init__.py 로 전체 모델 인식 가능
from app.database import engine, Base
from app.routers import complaint # 라우터
from app.routers import user_info 
from app.routers import login
from app.routers import register
app = FastAPI()

Base.metadata.create_all(bind=engine)

#CORS 허용(프론트 연동 시 필요)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 추후 도메인 지정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaint.router)
app.include_router(user_info.router)
app.include_router(login.router) 
app.include_router(register.router)
@app.get("/")
def root():
    return {"message": "DB 및 백엔드 정상 작동 중.."}
