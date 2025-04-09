from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.schemas.reply import ReplyBase
from app.models.complaint import Complaint
from app.models.reply import Reply
from app.database import SessionLocal
from typing import List, Optional 

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

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_complaints(
        db: Session = Depends(get_db), 
        sort: Optional[str] = None,
        limit: Optional[int] = 10,
        skip: Optional[int] = 0 
):
    query = db.query(Complaint)

    if sort == "created":   # created_at 기준으로 정렬
        complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    else:
        complaints = query.offset(skip).limit(limit).all()

    return complaints


# reply 관련
@router.post("/complaints/{id}/generate-reply", response_model=ReplyBase)
def generate_reply(id: int, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # 답변 생성 로직
    reply_content = f"답변 내용: {complaint.title}에 대한 답변입니다."

    reply = Reply(
        complaint_id = id,
        content = reply_content,
        tone="정중",
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    return reply

@router.put("/replies/{reply_id}", response_model=ReplyBase)
def update_reply(reply_id: int, content: str, db: Session = Depends(get_db)):
    reply = db.query(Reply).filter(Reply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    reply.content =content
    db.commit()
    db.refresh(reply)

    return reply

@router.get("/complaints/{id}/replies", response_model=List[ReplyBase])
def get_replies(id: int, db: Session = Depends(get_db)):
    replies = db.query(Reply).filter(Reply.complaint_id == id).all()
    if not replies:
        raise HTTPException(status_code=404, detail="Replies not found")

    return replies

@router.post("/replies/{reply_id}/copy", response_model=ReplyBase)
def copy_reply(reply_id: int, db: Session = Depends(get_db)):
    reply = db.query(Reply).filter(Reply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    #새로운 답변 복사 생성
    new_reply =Reply(
        complaint_id=reply.complaint_id,
        content=reply.content,
        tone=reply.tone
    )
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)

    return new_reply
