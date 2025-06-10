import pandas as pd
import io 
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.schemas.reply import ReplyBase
from app.models.complaint import Complaint
from app.models.reply import Reply
from app.models.user import User 
from app.models import UserInfo 
from app.database import SessionLocal
from typing import List, Optional
from app.schemas.complaint import ComplaintSummaryResponse, ReplyStatusUpdateRequest
from app.schemas.response_message import ResponseMessage
from app.auth import get_current_user
from datetime import datetime
from fastapi.responses import StreamingResponse
import pandas as pd
from sqlalchemy import text
import re
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
        is_public_str = str(row["민원 공개 여부"]).strip()

        if is_public_str == "공개":
            is_public = True
        elif is_public_str == "비공개":
            is_public = False
        else:
            raise HTTPException(
                status_code=400,
                detail=f"민원 공개 여부는 '공개' 또는 '비공개'만 허용됩니다. (입력값: {is_public_str})"
            )


        complaint = Complaint(
            user_uid=user_uid,
            title=row["제목"],
            content=row["민원내용"],
            is_public=is_public,
            created_at=datetime.utcnow()
        )
        db.add(complaint)


    db.commit()
    return ResponseMessage(message=f"{len(df)}건의 민원이 등록되었습니다.")


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
    else:
        complaints = query.offset(skip).limit(limit).all()

    return complaints

@router.get("/complaints/{id}", response_model=ComplaintResponse)
def get_complaint_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    return complaint

@router.delete("/complaints/{id}", response_model=ResponseMessage)
def delete_complaint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 민원 존재 및 소유 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    reply = db.query(Reply).filter(Reply.complaint_id == id).first()
    if reply:
        db.delete(reply)

    # 민원 삭제 (민원 요약 필드도 같이 삭제됨)
    db.delete(complaint)
    db.commit()

    return ResponseMessage(message=f"민원 {id}번과 관련된 답변 및 요약이 모두 삭제되었습니다.")

#민원응답 
@router.post("/complaints/{id}/generate-reply", response_model=ReplyBase)
def generate_reply(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 민원 유효성 및 권한 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원을 찾을 수 없거나 권한이 없습니다.")

    # 중복 답변 방지
    existing_reply = db.query(Reply).filter(Reply.complaint_id == id).first()
    if existing_reply:
        raise HTTPException(status_code=400, detail="이미 해당 민원에 대한 답변이 존재합니다.")

    # 담당자 정보 조회
    user_info = db.query(UserInfo).filter(UserInfo.user_uid == current_user.user_uid).first()
    if not user_info:
        raise HTTPException(status_code=400, detail="담당자 정보가 등록되어 있지 않습니다.")

    if not (user_info.department and user_info.name and user_info.contact):
        raise HTTPException(status_code=400, detail="담당자 정보(부서, 이름, 연락처)가 누락되었습니다.")

    # === 답변 조립 ===
    fixed_header = (
        "1. 평소 구정에 관심을 가져주신데 대해 감사드립니다.\n"
        "2. 귀하의 질의사항에 대하여 다음과 같이 답변드립니다.\n"
    )

    # generated_core = generate_llm_reply(complaint)  # LLM 연동 함수 필요

    fixed_footer = (
        f"3. 기타 궁금하신 사항은 {user_info.department}({user_info.name}, "
        f"{user_info.contact})로 문의하여 주시면 성심껏 답변드리겠습니다. 감사합니다."
    )

    reply_content = f"{fixed_header}임시 답변 내용입니다.\n{fixed_footer}"

    # DB 저장
    reply = Reply(
        complaint_id=id,
        content=reply_content,
        user_uid=current_user.user_uid
    )
    db.add(reply)
    complaint.reply_status = "수정중"
    db.commit()
    db.refresh(reply)

    return reply

# 답변 재생산(본인 것만)
@router.post("/complaints/{id}/generate-reply-again", response_model=ReplyBase)
def generate_reply_again(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 민원 소유자 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원을 찾을 수 없거나 권한이 없습니다.")

    # 기존 답변 삭제
    existing_reply = db.query(Reply).filter(Reply.complaint_id == id).first()
    if existing_reply:
        db.delete(existing_reply)
        db.commit()

    # 담당자 정보 조회
    user_info = db.query(UserInfo).filter(UserInfo.user_uid == current_user.user_uid).first()
    if not user_info or not (user_info.department and user_info.name and user_info.contact):
        raise HTTPException(status_code=400, detail="담당자 정보가 등록되어 있지 않거나 필수 항목이 누락되었습니다.")

    # 답변 내용 재조립
    fixed_header = (
        "1. 평소 구정에 관심을 가져주신데 대해 감사드립니다.\n"
        "2. 귀하의 질의사항에 대하여 다음과 같이 답변드립니다.\n"
    )
    fixed_footer = (
        f"3. 기타 궁금하신 사항은 {user_info.department}({user_info.name}, "
        f"{user_info.contact})로 문의하여 주시면 성심껏 답변드리겠습니다. 감사합니다."
    )
    reply_content = f"{fixed_header}임시 답변 내용입니다.\n{fixed_footer}"

    # 새 답변 저장
    new_reply = Reply(
        complaint_id=id,
        content=reply_content,
        user_uid=current_user.user_uid
    )
    db.add(new_reply)

    # 상태 갱신
    complaint.reply_status = "수정중"

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
    complaint.summary = complaint_summary
    db.commit()
    db.refresh(complaint)
    return ComplaintSummaryResponse(summary=complaint_summary)
    

@router.get("/complaints/{id}/reply-summary", response_model=ComplaintSummaryResponse)
def get_reply_summary(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    if not complaint.reply_summary:
        raise HTTPException(status_code=404, detail="요약이 아직 저장되지 않았습니다.")

    return ComplaintSummaryResponse(summary=complaint.reply_summary)


@router.put("/complaints/{id}/reply-summary", response_model=ResponseMessage)
def update_reply_summary(
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

    # 요약 저장 (수정)
    complaint.reply_summary = summary
    db.commit()
    db.refresh(complaint)

    return ResponseMessage(message="Reply summary updated successfully!")

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



@router.get("/complaints/{id}/history-similar", response_model=List[ReplyBase])
def get_similar_histories(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 민원 본문 가져오기
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    # 2. 텍스트 전처리 (소문자화 + 특수문자 제거 + 토큰 제한)
    raw_text = complaint.content[:300]
    cleaned_text = re.sub(r"[^\w\s]", " ", raw_text)
    tokens = cleaned_text.split()
    query_text = " ".join(tokens[:10]).lower()

    if not query_text.strip():
        raise HTTPException(status_code=400, detail="검색어가 유효하지 않습니다.")

    # 3. Full Text Search (websearch_to_tsquery 사용)
    sql = text("""
        SELECT urh.*
        FROM user_reply_history urh
        WHERE to_tsvector('simple', LOWER(final_content)) @@ websearch_to_tsquery('simple', :query)
        ORDER BY ts_rank(to_tsvector('simple', LOWER(final_content)), websearch_to_tsquery('simple', :query)) DESC
        LIMIT 10
    """)
    
    try:
        rows = db.execute(sql, {"query": query_text}).fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FTS 실행 실패: {str(e)}")

    if not rows:
        raise HTTPException(status_code=404, detail="유사한 민원이 없습니다.")

    return [{"content": row.final_content} for row in rows]


@router.get("/complaints/download-excel")
def download_complaints_excel(
    ids: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. ID 파싱
    id_list = [int(i) for i in ids.split(",") if i.isdigit()]

    if not id_list:
        raise HTTPException(status_code=400, detail="유효한 민원 ID 목록을 전달해주세요.")

    # 2. 본인 소유 민원 + 답변 조회
    complaints = db.query(Complaint).filter(
        Complaint.user_uid == current_user.user_uid,
        Complaint.id.in_(id_list)
    ).all()

    if not complaints:
        raise HTTPException(status_code=404, detail="조회된 민원이 없습니다.")

    rows = []
    for complaint in complaints:
        reply = db.query(Reply).filter(Reply.complaint_id == complaint.id).first()
        rows.append({

            "제목": complaint.title,
            "내용": complaint.content,
            "등록일": complaint.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "공개 여부": "공개" if complaint.is_public else "비공개",
            "답변": reply.content if reply else "(답변 없음)"
        })

    # 3. DataFrame → 엑셀 변환
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='민원내역')

    output.seek(0)

    # 4. 응답 반환
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=complaints.xlsx"}
    )


@router.put("/complaints/{id}/reply-status", response_model=ResponseMessage)
def update_reply_status(
    id: int,
    data: ReplyStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    allowed_status = {"답변전", "수정중", "답변완료"}
    if data.status not in allowed_status:
        raise HTTPException(status_code=400, detail=f"상태는 {allowed_status} 중 하나여야 합니다.")

    complaint.reply_status = data.status
    db.commit()
    db.refresh(complaint)

    return ResponseMessage(message=f"답변 상태가 '{data.status}'(으)로 변경되었습니다.")