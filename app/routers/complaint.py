import pandas as pd
import io 
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.schemas.reply import ReplyBase
from app.models.complaint import Complaint
from app.models.reply import Reply
from app.models.user import User 
from app.database import SessionLocal
from typing import List, Optional
from app.schemas.complaint import ComplaintSummaryResponse
from app.schemas.response_message import ResponseMessage
from app.auth import get_current_user
from datetime import datetime


router = APIRouter()

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 민원 업로드
@router.post("/complaints/upload-excel", response_model=ResponseMessage)
async def upload_complaints_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user_uid = current_user.user_uid  # JWT sub 사용

    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))

    required_columns = {"제목", "민원내용", "민원 공개 여부"}
    if not required_columns.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"다음 컬럼이 포함되어야 합니다: {required_columns}")

    for _, row in df.iterrows():
        complaint = Complaint(
            user_uid=user_uid,
            title=row["제목"],
            content=row["민원내용"],
            urgency=0,
            created_at=datetime.utcnow()
        )
        db.add(complaint)

    db.commit()
    return ResponseMessage(message=f"{len(df)}건의 민원이 등록되었습니다.")


# @router.post("/complaints/upload-text", response_model=ComplaintResponse)
# def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
#     complaint = Complaint(
#         user_uid=current_user.user_uid,
#         title=data.title,
#         content=data.content,
#         urgency=data.urgency,
#     )
#     db.add(complaint)
#     db.commit()
#     db.refresh(complaint)
#     return complaint

# 민원 조회(본인 것만) 
@router.get("/complaints", response_model=List[ComplaintResponse])
def get_complaints(
    db: Session = Depends(get_db), 
    sort: Optional[str] = None,
    limit: Optional[int] = 10,
    skip: Optional[int] = 0, 
    current_user: str = Depends(get_current_user)
):
    query = db.query(Complaint).filter(Complaint.user_uid == current_user.user_uid)

    if sort == "created":
        complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    elif sort == "urgency":
        query = query.order_by(Complaint.urgency.desc()).offset(skip).limit(limit).all()
    else:
        complaints = query.offset(skip).limit(limit).all()

    return complaints


# 민원 응답(본인 것만) 
@router.post("/complaints/{id}/generate-reply", response_model=ReplyBase)
def generate_reply(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # JWT에서 가져온 유저
):
    # 해당 민원이 현재 유저의 것인지 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원을 찾을 수 없거나 권한이 없습니다.")
    
    # 답변 중복 생성 방지
    existing_reply = db.query(Reply).filter(Reply.complaint_id == id).first()
    if existing_reply:
        raise HTTPException(status_code=400, detail="이미 해당 민원에 대한 답변이 존재합니다.")

    # 답변 생성
    reply_content = f"답변 내용: {complaint.title}에 대한 답변입니다."

    reply = Reply(
        complaint_id=id,
        content=reply_content,
        user_uid=current_user.user_uid  # 작성자 기록 (선택적이지만 추천)
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    return reply 

# 답변 재생산(본인 것만) / 리플라이아이디 바뀌는 문제 있음 
@router.post("/complaints/{id}/generate-reply-again", response_model=ReplyBase)
def generate_reply_again(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    # 해당 민원이 현재 유저의 것인지 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원을 찾을 수 없거나 권한이 없습니다.")

    # 기존 답변 삭제 (있다면)
    existing_reply = db.query(Reply).filter(Reply.complaint_id == id).first()
    if existing_reply:
        db.delete(existing_reply)
        db.commit()

    # 새 답변 직접 생성
    new_content = f"답변 내용: {complaint.title}에 대한 답변입니다."

    new_reply = Reply(content=new_content, complaint_id=id, user_uid=current_user.user_uid)
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)

    return new_reply

# 관리자용 응답 조회
@router.get("/admin/replies", response_model=List[ReplyBase])
def get_all_replies(
    db: Session = Depends(get_db)
):
    replies = db.query(Reply).all()
    return replies

#______________
# 응답 수정(컴플레인 아이디로 )
@router.put("/complaints/{complaint_id}/reply", response_model=ReplyBase)
def update_reply(
    complaint_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 민원 소유자 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.user_uid == current_user.user_uid
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    # 답변 존재 여부 확인
    reply = db.query(Reply).filter(
        Reply.complaint_id == complaint_id,
        Reply.user_uid == current_user.user_uid
    ).first()
    if not reply:
        raise HTTPException(status_code=404, detail="해당 민원에 대한 답변이 없습니다.")

    # 내용 수정
    reply.content = content
    db.commit()
    db.refresh(reply)

    return reply

# 응답 검색(컴플레인 아이디로 )
@router.get("/complaints/{id}/replies", response_model=List[ReplyBase])
def get_replies(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 민원이 현재 유저 소유인지 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    # 해당 민원에 대한 답변 조회
    replies = db.query(Reply).filter(
        Reply.complaint_id == id
    ).all()

    if not replies:
        raise HTTPException(status_code=404, detail="답변이 없습니다.")

    return replies


@router.get("/complaints/{id}/summary", response_model=ComplaintSummaryResponse)
def get_complaint_summary(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 현재 유저의 민원인지 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    # 요약 처리 (예시)
    complaint_summary = "민원 요지: " + complaint.content[:100]
    return ComplaintSummaryResponse(summary=complaint_summary)

@router.post("/complaints/{id}/reply-summary", response_model=ResponseMessage)
def input_reply_summary(
    id: int,
    summary: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 본인 민원인지 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    # 요약 저장
    complaint.reply_summary = summary
    db.commit()
    db.refresh(complaint)

    return ResponseMessage(message="Reply summary saved successfully!")


# @router.get("/complaints/{id}/reply-options", response_model=List[ReplyBase])
# def get_reply_options(id: int, db: Session = Depends(get_db)):
#     # 해당 민원에 대한 모든 답변 조회
#     replies = db.query(Reply).filter(Reply.complaint_id == id).all()
#     if not replies:
#         raise HTTPException(status_code=404, detail="No replies found for this complaint")
    
#     return replies


@router.get("/complaints/{id}/similar-replies", response_model=List[ReplyBase])
def get_similar_replies(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 본인 민원인지 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    # 유사한 답변 검색
    similar_replies = db.query(Reply).filter(
        Reply.content.like(f"%{complaint.content[:50]}%")
    ).all()

    if not similar_replies:
        raise HTTPException(status_code=404, detail="유사한 답변이 없습니다.")

    return similar_replies
