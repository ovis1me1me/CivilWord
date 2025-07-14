#app.routers.register
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.user_info import UserInfo
from app.auth import get_password_hash
import uuid
import bcrypt
from app.schemas.auth import RegisterUserRequest

router = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register_user(data: RegisterUserRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.user_id == data.user.user_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID already exists")

    user_uid = str(uuid.uuid4())

    new_user = User(
        user_uid=user_uid,
        user_id=data.user.user_id,
        password=hash_password(data.user.password),
        question=data.user.question,   
        answer=data.user.answer,
    )
    db.add(new_user)

    new_user_info = UserInfo(
        user_uid=user_uid,
        name=data.user_info.name,
        department=data.user_info.department,
        contact=data.user_info.contact,
        email=data.user_info.email,
    )
    db.add(new_user_info)

    db.commit()
    return {"message": "User registered successfully"}

