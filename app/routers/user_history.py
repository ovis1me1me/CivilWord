from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user_reply_history import UserReplyHistory
from app.models.user import User
from app.schemas.reply_history import UserReplyHistoryResponse
from app.auth import get_current_user
from typing import List

router = APIRouter()

@router.get("/user-history/replies", response_model=List[UserReplyHistoryResponse])
def get_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(UserReplyHistory).filter(
        UserReplyHistory.user_uid == current_user.user_uid
    ).all()
    return history

@router.get("/user-history/search", response_model=List[UserReplyHistoryResponse])
def search_user_history(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    사용자 답변 히스토리에서 Full Text Search로 유사한 항목 검색
    """
    sql = text("""
        SELECT *
        FROM user_reply_history
        WHERE user_uid = :user_uid
          AND to_tsvector('simple', final_content::text)
              @@ websearch_to_tsquery('simple', :query)
        ORDER BY ts_rank(to_tsvector('simple', final_content::text), websearch_to_tsquery('simple', :query)) DESC
        LIMIT 20;
    """)

    try:
        rows = db.execute(sql, {"user_uid": current_user.user_uid, "query": q}).fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"쿼리 실행 실패: {str(e)}")

    if not rows:
        raise HTTPException(status_code=404, detail="해당 키워드에 대한 유사 히스토리가 없습니다.")

    return [dict(row._mapping) for row in rows]  # SQLAlchemy Row → dict 변환
