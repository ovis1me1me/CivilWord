from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.user_info import UserInfoCreate
from app.models.user_info import UserInfo
from app.database import SessionLocal

router = APIRouter()

#DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/user-info")
def create_user_info(data: UserInfoCreate, db: Session = Depends(get_db)):
    user_info = UserInfo(
        user_id=data.user_id,
        name=data.name,
        department=data.department,
        contact=data.contact,
        category=data.category
            )
    db.add(user_info)
    db.commit()
    db.refresh(user_info)
    
    return user_info

@router.get("/user-info")
def get_user_info(db: Session = Depends(get_db)):
    user_info = db.query(UserInfo).first()  # 첫 번째 사용자 정보 조회

    return user_info

@router.put("/user-info")
def update_user_info(data: UserInfoCreate, db: Session = Depends(get_db)):
    user_info = db.query(UserInfo).filter(UserInfo.user_id == data.user_id).first()
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")

    user_info.name = data.name
    user_department = data.department
    suer_info.contact = data.contact
    user_info.category = data.category

    db.commit()
    db.refresh(user_info)

    return user_info
