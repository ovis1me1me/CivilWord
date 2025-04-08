from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.models.complaint import Complaint
from app.database import SessionLocal

router = APIRouter()

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/complaints/upload-text", response_model=ComplaintResponse)
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    complaint = Complaint(
            user_id=data.user_id,
            title=data.title,
            content=data.content,
            urgency=data.urgency,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint    # create_at까지 자동 반환 
