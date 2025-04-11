from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.schemas.auth import UserCreate
from app.auth import get_password_hash

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
    # 중복된 username 확인
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    # 비밀번호 해싱
    hashed_password = get_password_hash(data.password)

    # 유저 생성
    new_user = User(
        username=data.username,
        hashed_password=hashed_password,
        name=data.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}
