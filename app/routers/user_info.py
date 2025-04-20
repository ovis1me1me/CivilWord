from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user_info import UserInfo
from app.schemas.user_info import UserInfoCreate, UserInfoResponse
from app.database import SessionLocal
from app.auth import get_current_user

router = APIRouter()

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/user-info", response_model=UserInfoResponse)
def get_user_info(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_info = db.query(UserInfo).filter(UserInfo.user_uid == current_user['sub']).first()
    if not user_info:
        raise HTTPException(status_code=404, detail="UserInfo not found")
    return user_info

@router.put("/user-info", response_model=UserInfoResponse)
def update_user_info(data: UserInfoCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_info = db.query(UserInfo).filter(UserInfo.user_uid == current_user['sub']).first()
    if not user_info:
        raise HTTPException(status_code=404, detail="UserInfo not found")

    # user_uid는 수정하지 않음
    user_info.name = data.name
    user_info.department = data.department
    user_info.contact = data.contact
    user_info.category = data.category
    db.commit()
    db.refresh(user_info)
    
    return user_info

@router.post("/user-info", response_model=UserInfoResponse)
def create_user_info(data: UserInfoCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_user_info = db.query(UserInfo).filter(UserInfo.user_uid == current_user['sub']).first()
    if existing_user_info:
        raise HTTPException(status_code=400, detail="User info already exists")
    
    user_info = UserInfo(
        user_uid=current_user['sub'],
        name=data.name,
        department=data.department,
        contact=data.contact,
        category=data.category
    )
    db.add(user_info)
    db.commit()
    db.refresh(user_info)
    
    return user_info
