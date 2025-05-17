from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.schemas.complaint_history import ComplaintHistoryResponse 
from app.models.reply import Reply
from app.schemas.response_message import ResponseMessage
from app.models.user import User
from app.auth import get_current_user
from app.models.user import User
from fastapi import Depends
from typing import List


router = APIRouter()

@router.post("/complaints/move-to-history", response_model=ResponseMessage)
def move_complaints_to_history(
    ids: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    id_list = [int(i) for i in ids.split(",") if i.isdigit()]
    if not id_list:
        raise HTTPException(status_code=400, detail="유효한 민원 ID 목록을 전달해주세요.")

    complaints = db.query(Complaint).filter(
        Complaint.user_uid == current_user.user_uid,
        Complaint.id.in_(id_list)
    ).all()

    if not complaints:
        raise HTTPException(status_code=404, detail="조회된 민원이 없습니다.")

    for complaint in complaints:
        reply = db.query(Reply).filter(Reply.complaint_id == complaint.id).first()
        reply_content = reply.content if reply else None

        history = ComplaintHistory(
            id=complaint.id,
            user_uid=complaint.user_uid,
            title=complaint.title,
            content=complaint.content,
            is_public=complaint.is_public,
            created_at=complaint.created_at,
            reply_summary=complaint.reply_summary,
            reply_content=reply_content
        )
        db.add(history)

        # 원본 Reply 삭제
        replies = db.query(Reply).filter(Reply.complaint_id == complaint.id).all()
        for r in replies:
            db.delete(r)

        # 원본 Complaint 삭제
        db.delete(complaint)

    db.commit()  # 루프 밖에서 한번만 커밋

    return ResponseMessage(message=f"{len(complaints)}건의 민원을 히스토리로 이동했습니다.")

@router.get("/complaints/history", response_model=List[ComplaintHistoryResponse])
def get_complaint_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    histories = db.query(ComplaintHistory).filter(
        ComplaintHistory.user_uid == current_user.user_uid
    ).all()
    return histories

@router.get("/complaints/history/search", response_model=List[ComplaintHistoryResponse])
def search_complaint_history_by_title(
    keyword: str = Query(..., min_length=1, description="검색할 제목 키워드"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 제목에 keyword 포함하는 히스토리 필터링 (대소문자 구분없이)
    histories = db.query(ComplaintHistory).filter(
        ComplaintHistory.user_uid == current_user.user_uid,
        ComplaintHistory.title.ilike(f"%{keyword}%")
    ).all()

    if not histories:
        raise HTTPException(status_code=404, detail="검색어에 해당하는 히스토리가 없습니다.")

    return histories