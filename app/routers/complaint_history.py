from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.schemas.complaint_history import ComplaintHistoryResponse,HistorySimpleContent
from app.schemas.reply import ReplyBase, SimpleContent
from app.models.reply import Reply
from app.schemas.response_message import ResponseMessage
from app.models.user import User
from app.auth import get_current_user
from app.models.user import User
from fastapi import Depends
from typing import List
import re
from sqlalchemy import text



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

@router.get("/complaints/history/{id}", response_model=HistorySimpleContent)
def get_complaint_history_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    자신의 민원 히스토리 상세 조회 (제목, 본문, 답변만 반환)
    """
    complaint_history = db.query(ComplaintHistory).filter(
        ComplaintHistory.id == id,
        ComplaintHistory.user_uid == current_user.user_uid
    ).first()

    if not complaint_history:
        raise HTTPException(status_code=404, detail="해당 히스토리를 찾을 수 없거나 권한이 없습니다.")

    return {
        "title": complaint_history.title,
        "content": complaint_history.content,
        "reply_content": complaint_history.reply_content  # 정확한 필드명
    }

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

@router.get("/test/complaints/history", response_model=List[ComplaintHistoryResponse])
def get_all_complaint_histories_for_test(
    db: Session = Depends(get_db)
):
    """
     [테스트용] 모든 유저의 민원 히스토리 전체 조회 (인증 없음)
    실제 서비스에서는 제거 또는 관리자 인증 필요
    """
    histories = db.query(ComplaintHistory)\
    .order_by(ComplaintHistory.created_at.desc())\
    .limit(100).all()

    return histories

@router.get("/history/{id}/similar", response_model=list[SimpleContent])
def get_similar_complaints_by_content(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 기준 민원 조회
    complaint = db.query(ComplaintHistory).filter(ComplaintHistory.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 히스토리에 없습니다.")

    if not complaint.content:
        raise HTTPException(status_code=400, detail="해당 민원에 본문 내용이 없습니다.")

    # 2. pg_trgm 유사도 검색 (content 기준)
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