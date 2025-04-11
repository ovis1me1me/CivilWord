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
    user_info = db.query(UserInfo).filter(UserInfo.user_id == current_user['sub']).first()
    if not user_info:
        raise HTTPException(status_code=404, detail="UserInfo not found")
    
    return user_info  # 로그인한 유저의 정보 반환

@router.put("/user-info", response_model=UserInfoResponse)
def update_user_info(data: UserInfoCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_info = db.query(UserInfo).filter(UserInfo.user_id == current_user['sub']).first()
    if not user_info:
        raise HTTPException(status_code=404, detail="UserInfo not found")
    
    # user_id는 수정할 수 없으므로 변경하지 않음
    user_info.name = data.name
    user_info.department = data.department
    user_info.contact = data.contact
    user_info.category = data.category
    db.commit()
    db.refresh(user_info)
    
    return user_info  # 수정된 유저 정보 반환

@router.post("/user-info", response_model=UserInfoResponse)
def create_user_info(data: UserInfoCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # 이미 유저 정보가 있는지 확인
    existing_user_info = db.query(UserInfo).filter(UserInfo.user_id == current_user['sub']).first()
    if existing_user_info:
        raise HTTPException(status_code=400, detail="User info already exists")
    
    # 유저 정보 생성
    user_info = UserInfo(
        user_id=current_user['sub'],  # 로그인한 사용자의 user_id를 유저 정보에 저장
        name=data.name,
        department=data.department,
        contact=data.contact,
        category=data.category
    )
    db.add(user_info)
    db.commit()
    db.refresh(user_info)
    
    return user_info  # 새로 생성된 유저 정보 반환
