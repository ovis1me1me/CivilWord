from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.schemas.reply import ReplyBase
from app.models.complaint import Complaint
from app.models.reply import Reply
from app.database import SessionLocal
from typing import List, Optional
from app.schemas.complaint import ComplaintSummaryResponse
from app.schemas.response_message import ResponseMessage
from app.auth import get_current_user

router = APIRouter()

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/complaints/upload-text", response_model=ComplaintResponse)
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    # 로그인된 유저의 ID로 설정
    complaint = Complaint(
            user_id=current_user['sub'],  # JWT에서 가져온 로그인된 유저의 'sub' 값을 사용
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
        skip: Optional[int] = 0, 
        current_user: str = Depends(get_current_user)
):
    query = db.query(Complaint).filter(Complaint.user_id == current_user['sub'])  # 로그인된 유저의 민원만 조회

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
    reply_tone = complaint.tone if complaint.tone else "정중"  # 기본 톤 설정

    reply = Reply(
        complaint_id=id,
        content=reply_content,
        tone=reply_tone,
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

    reply.content = content
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
    # 새로운 답변 복사 생성
    new_reply = Reply(
        complaint_id=reply.complaint_id,
        content=reply.content,
        tone=reply.tone
    )
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)

    return new_reply

@router.get("/complaints/{id}/summary", response_model=ComplaintSummaryResponse)
def get_complaint_summary(id: int, db: Session = Depends(get_db)):
    # 민원 조회
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # LLM 사용하여 민원 요지 추출(현재 가상 코드)
    complaint_summary = "민원 요지: " + complaint.content[:100]  # 예시로 민원 내용 일부만 반환
    return ComplaintSummaryResponse(summary=complaint_summary)  # 모델을 통해 반환

@router.post("/complaints/{id}/reply-summary", response_model=ResponseMessage)
def input_reply_summary(id: int, summary: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.reply_summary = summary
    db.commit()
    db.refresh(complaint)

    return ResponseMessage(message="Reply summary saved successfully!")

@router.post("/complaints/{id}/tone", response_model=ResponseMessage)
def choose_tone(id: int, tone: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.tone = tone
    db.commit()
    db.refresh(complaint)

    return ResponseMessage(message=f"Tone '{tone}' saved successfully!")

@router.get("/complaints/{id}/reply-options", response_model=List[ReplyBase])
def get_reply_options(id: int, db: Session = Depends(get_db)):
    # 해당 민원에 대한 모든 답변 조회
    replies = db.query(Reply).filter(Reply.complaint_id == id).all()
    if not replies:
        raise HTTPException(status_code=404, detail="No replies found for this complaint")
    
    return replies


@router.get("/complaints/{id}/similar-replies", response_model=List[ReplyBase])
def get_similar_replies(id: int, db: Session = Depends(get_db)):
    # 해당 민원 조회
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # 민원의 내용 또는 제목을 기준으로 유사한 답변 조회
    similar_replies = db.query(Reply).filter(Reply.content.like(f"%{complaint.content[:50]}%")).all()
    
    if not similar_replies:
        raise HTTPException(status_code=404, detail="No similar replies found")
    
    return similar_replies
