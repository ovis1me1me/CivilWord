from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.auth import create_access_token, verify_password, get_current_user
from app.models.user import User
from app.schemas.auth import UserLogin
from app.routers import complaint, user_info, login, register  # 라우터들 임포트

app = FastAPI()

# CORS 설정 (프론트엔드와의 연결을 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 추후 도메인 지정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 테이블 생성
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


# DB 세션 의존성 주입 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 로그인 엔드포인트
@app.post("/login")
def login_for_access_token(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# 인증된 사용자 정보 요청 엔드포인트
@app.get("/user-info")
def get_user_info(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.username}"}
