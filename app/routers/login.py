from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import Token
from app.auth import create_access_token, verify_password
from app.database import SessionLocal
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # 로그인 ID는 user_id 기준으로 조회
    user = db.query(User).filter(User.user_id == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # JWT에는 고유 식별자인 user_uid를 넣음
    access_token = create_access_token(data={"sub": user.user_uid})
    return {"access_token": access_token, "token_type": "bearer"}
