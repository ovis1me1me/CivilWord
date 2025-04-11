from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import UserCreate, Token,UserLogin
from app.auth import create_access_token, verify_password
from app.database import SessionLocal

router = APIRouter()

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=Token)
def login_for_access_token(data: UserLogin, db: Session = Depends(get_db)):
    # UserLogin에서 받은 username으로 DB에서 사용자 검색
    user = db.query(User).filter(User.username == data.username).first()
    
    # 유저가 없거나 비밀번호가 일치하지 않으면 에러 반환
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}