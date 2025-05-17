# app/routers/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.user_info import UserInfo
from app.schemas.user import (
    FindQuestionRequest, FindQuestionResponse,
    VerifyAnswerRequest, VerifyAnswerResponse,
    FindUserIdRequest, FindUserIdResponse
    )
from app.schemas.auth import ChangePasswordRequest, ChangePasswordResponse
from app.routers.register import hash_password

router = APIRouter()

@router.post("/find-user-id", response_model=FindUserIdResponse)
def find_user_id(request: FindUserIdRequest, db: Session = Depends(get_db)):
    # 이메일 + 이름 + 연락처 조건으로 검색
    user_info = db.query(UserInfo).filter(
        UserInfo.email == request.email,
        UserInfo.name == request.name,
        UserInfo.contact == request.contact
    ).first()

    if not user_info:
        raise HTTPException(status_code=404, detail="해당 정보와 일치하는 사용자를 찾을 수 없습니다.")

    user = db.query(User).filter(User.user_uid == user_info.user_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자 계정이 존재하지 않습니다.")

    return FindUserIdResponse(user_id=user.user_id)

@router.post("/find-password/question", response_model=FindQuestionResponse)
def get_question(request: FindQuestionRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="아이디를 찾을 수 없습니다.")
    return FindQuestionResponse(question=user.question)


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    if user.answer.strip().lower() != data.answer.strip().lower():
        raise HTTPException(status_code=403, detail="답변이 일치하지 않습니다.")

    hashed_pwd = hash_password(data.new_password)
    user.password = hashed_pwd
    db.commit()

    return ChangePasswordResponse(message="비밀번호가 성공적으로 변경되었습니다.")