from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user_reply_history import UserReplyHistory
from app.models.user import User

from app.schemas.reply_history import UserReplyHistoryResponse
from app.auth import get_current_user
from typing import List
from app.database import get_db


router = APIRouter()


@router.get("/user-history/replies", response_model=List[UserReplyHistoryResponse])
def get_user_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(UserReplyHistory).filter(UserReplyHistory.user_uid == current_user.user_uid).all()
    return history

@router.get("/user-history/search", response_model=List[UserReplyHistoryResponse])
def search_user_history(q: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(UserReplyHistory).filter(
        UserReplyHistory.user_uid == current_user.user_uid,
        UserReplyHistory.final_content.ilike(f"%{q}%")
    ).all()
    return history

