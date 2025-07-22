from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.database import get_db
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.reply import Reply
from app.models.user import User
from app.schemas.complaint_history import ComplaintHistoryResponse, HistorySimpleContent
from app.schemas.reply import SimpleContent
from app.schemas.response_message import ResponseMessage
from app.auth import get_current_user

router = APIRouter()

# ✅ 1. 검색 (가장 먼저)
@router.get("/complaints/history/search", response_model=List[ComplaintHistoryResponse])
def search_complaint_history_by_title(
    keyword: str = Query(..., min_length=1, description="검색할 제목 키워드"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    histories = db.query(ComplaintHistory).filter(
        ComplaintHistory.user_uid == current_user.user_uid,
        ComplaintHistory.title.ilike(f"%{keyword}%")
    ).all()

    if not histories:
        raise HTTPException(status_code=404, detail="검색어에 해당하는 히스토리가 없습니다.")

    return histories

# ✅ 2. 히스토리 전체 조회 (정적 URL)
@router.get("/complaints/history", response_model=List[ComplaintHistoryResponse])
def get_complaint_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    histories = db.query(ComplaintHistory).filter(
        ComplaintHistory.user_uid == current_user.user_uid
    ).all()
    return histories

# ✅ 3. 히스토리 상세 조회 (동적 URL)
@router.get("/complaints/history/{id}", response_model=HistorySimpleContent)
def get_complaint_history_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint_history = db.query(ComplaintHistory).filter(
        ComplaintHistory.id == id,
        ComplaintHistory.user_uid == current_user.user_uid
    ).first()

    if not complaint_history:
        raise HTTPException(status_code=404, detail="해당 히스토리를 찾을 수 없거나 권한이 없습니다.")

    return {
        "title": complaint_history.title,
        "content": complaint_history.content,
        "reply_content": complaint_history.reply_content
    }

# ✅ 4. 히스토리 유사 민원 검색
@router.get("/history/{id}/similar", response_model=List[SimpleContent])
def get_similar_complaints_by_content(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(ComplaintHistory).filter(ComplaintHistory.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 히스토리에 없습니다.")

    if not complaint.content:
        raise HTTPException(status_code=400, detail="해당 민원에 본문 내용이 없습니다.")

    sql = text("""
        SELECT id, content
        FROM complaint_history
        WHERE similarity(content, :query) > 0.2
        ORDER BY similarity(content, :query) DESC
        LIMIT 10;
    """)

    try:
        rows = db.execute(sql, {"query": complaint.content}).fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"쿼리 실행 실패: {str(e)}")

    if not rows:
        raise HTTPException(status_code=404, detail="유사한 민원이 없습니다.")

    return [{"content": row.content} for row in rows]

# ✅ 5. 히스토리로 민원 이동 (POST)
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
            user_uid=complaint.user_uid,
            title=complaint.title,
            summary=complaint.summary,
            content=complaint.content,
            is_public=complaint.is_public,
            created_at=complaint.created_at,
            reply_summary=complaint.reply_summary,
            reply_content=reply_content
        )
        db.add(history)

        replies = db.query(Reply).filter(Reply.complaint_id == complaint.id).all()
        for r in replies:
            db.delete(r)

        db.delete(complaint)

    db.commit()

    return ResponseMessage(message=f"{len(complaints)}건의 민원을 히스토리로 이동했습니다.")

# ✅ 6. 테스트용 전체 히스토리 조회 (비인증)
@router.get("/test/complaints/history", response_model=List[ComplaintHistoryResponse])
def get_all_complaint_histories_for_test(
    db: Session = Depends(get_db)
):
    histories = db.query(ComplaintHistory)\
        .order_by(ComplaintHistory.created_at.desc())\
        .limit(100).all()
    return histories
