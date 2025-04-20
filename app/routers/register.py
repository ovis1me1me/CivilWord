from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.schemas.auth import UserCreate
from app.auth import get_password_hash
from uuid import uuid4  # 외부 식별자용

router = APIRouter()

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register_user(data: UserCreate, db: Session = Depends(get_db)):
    # 중복된 user_id 확인
    existing_user = db.query(User).filter(User.user_id == data.user_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID already taken")

    # 비밀번호 해싱
    hashed_password = get_password_hash(data.password)

    # 유저 생성 (외부 식별자는 UUID 생성)
    new_user = User(
        user_uid=str(uuid4()),
        user_id=data.user_id,
        name=data.name,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}
