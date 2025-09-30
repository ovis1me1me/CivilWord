import pandas as pd
import io 
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Body
from sqlalchemy import Column, Integer, JSON  # 또는 JSONB (PostgreSQL)
# 7/21 ComplaintResponse, ComplaintCreate 추가
from app.schemas.complaint import ComplaintListResponse, FullReplySummaryResponse, ReplySummaryUpdateRequest, ComplaintResponse, ComplaintCreate
from app.schemas.reply import ReplyBase
from app.models.complaint import Complaint
from app.models.reply import Reply
from app.models.user import User 
from app.models import UserInfo 
from app.database import SessionLocal
from typing import List, Optional
from app.schemas.complaint import ComplaintReplySummaryResponse,ComplaintSummaryResponse, ReplyStatusUpdateRequest
from app.schemas.response_message import ResponseMessage
from app.auth import get_current_user
from datetime import datetime
from fastapi.responses import StreamingResponse
import pandas as pd
from sqlalchemy import text
import re
from bllossom8b_infer.inference import generate_llm_reply  # 함수 임포트
from blossom_summarizer.summarizer import summarize_with_blossom
from typing import Any
from sqlalchemy.orm import Session
from app.schemas.complaint import ReplySummaryRequest
from app.models.complaint_history import ComplaintHistory
from fastapi import Body
from pydantic import BaseModel

from app.models.similar_history import SimilarHistory
import json

# 로그 전용
import logging
logger = logging.getLogger(__name__)  
logging.basicConfig(level=logging.INFO)

router = APIRouter()

# DB 세션 의존성 주입
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 단일 민원 생성 라우터
@router.post("/complaints")
def create_complaint(
    payload: ComplaintCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 기본 검증
    title = (payload.title or "").strip()
    content = (payload.content or "").strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail="title과 content는 비어 있을 수 없습니다.")

    is_public = bool(payload.is_public) if payload.is_public is not None else False

    # DB 저장
    complaint = Complaint(
        user_uid=current_user.user_uid,
        title=title,
        content=content,
        is_public=is_public,
        created_at=datetime.utcnow(),
        reply_summary={},  # 단일 입력 모드는 초기값 비움
    )
    db.add(complaint)  
    db.commit()
    db.refresh(complaint)

    return {
        "id": complaint.id,
        "message": "민원이 생성되었습니다."
    }
    

#1. 엑셀 업로드 라우터 (동적 URL보다 먼저 등록)
# [complaint]에 민원요약, 답변요약 비우고 저장
@router.post("/complaints/upload-excel", response_model=ResponseMessage)
async def upload_complaints_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_uid = current_user.user_uid  # 또는 current_user["sub"] 타입에 따라

    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"엑셀 파일 읽기 오류: {str(e)}")

    required_columns = {"제목", "민원내용", "민원 공개 여부"}
    if not required_columns.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"다음 컬럼이 포함되어야 합니다: {required_columns}")

    for _, row in df[::-1].iterrows():
        공개여부 = str(row["민원 공개 여부"]).strip()
        if 공개여부 == "공개":
            is_public = True
        elif 공개여부 == "비공개":
            is_public = False
        else:
            raise HTTPException(
                status_code=400,
                detail=f"민원 공개 여부는 '공개' 또는 '비공개'만 허용됩니다. (입력값: {공개여부})"
            )

        complaint = Complaint(
            user_uid=user_uid,
            title=row["제목"],
            content=row["민원내용"],
            is_public=is_public,
            created_at=datetime.utcnow(),
            reply_summary={} 
        )
        db.add(complaint)

    db.commit()
    return ResponseMessage(message=f"{len(df)}건의 민원이 등록되었습니다.")

# 2. 엑셀 다운로드 라우터 
# [complaint]의 민원 관련 내용 및 [reply]의 답변 내용 엑셀로 추출
# ✅ 답변 내용을 포맷팅하는 함수
def format_reply_content(content: dict) -> str:
    if not isinstance(content, dict):
        return str(content)

    lines = []
    idx = 1

    header = content.get("header", "").strip()
    if header:
        lines.append(f"{idx}. {header}")
        idx += 1

    summary = content.get("summary", "").strip()
    if summary:
        lines.append(f"{idx}. {summary}")
        idx += 1

    body = content.get("body", [])
    for item in body:
        index = item.get("index", "").strip()
        if index:
            lines.append(f"{idx}. {index}")
            idx += 1
        for section in item.get("section", []):
            title = section.get("title", "").strip()
            text = section.get("text", "").strip()
            lines.append(f"{title}. {text}")

    footer = content.get("footer", "").strip()
    if footer:
        lines.append(f"\n{idx}. {footer}")

    return "\n".join(lines)


# ✅ 엑셀 다운로드 라우터
@router.get("/complaints/download-excel")
def download_complaints_excel(
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

    rows = []
    for complaint in complaints:
        reply = db.query(Reply).filter(Reply.complaint_id == complaint.id).first()
        reply_text = format_reply_content(reply.content) if reply and reply.content else "(답변 없음)"

        rows.append({
            "제목": complaint.title,
            "내용": complaint.content,
            "등록일": complaint.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "공개 여부": "공개" if complaint.is_public else "비공개",
            "답변": reply_text
        })

    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='민원내역')

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=complaints.xlsx"}
    )

# 3. 민원 목록 반환 라우터
# 해당 유저 [complaint] 민원 목록 반환
@router.get("/complaints", response_model=ComplaintListResponse) 
def get_complaints(
    db: Session = Depends(get_db), 
    sort: Optional[str] = None,
    limit: Optional[int] = 10,
    skip: Optional[int] = 0, 
    current_user: str = Depends(get_current_user)
):
    query = db.query(Complaint).filter(Complaint.user_uid == current_user.user_uid)

    total = query.count()

    if sort == "created_desc":
        complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    elif sort == "created_asc":
        complaints = query.order_by(Complaint.created_at.asc()).offset(skip).limit(limit).all()
    else:
        complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "complaints": complaints
    }

# 4. 민원 반환 라우터
# id 에 맞는 [complaint] 데이터 반환
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

# 5. 민원 삭제
# 해당하는 [complaint] 및 [reply] 데이터 삭제
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

# 6. 답변 생성(LLM) 라우터 
# [complaint]의 reply_summary를 input하여 [reply] 데이터 생성
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
    " 평소 구정에 관심을 가져주신데 대해 감사드립니다.\n")

    fixed_summary = (
        f" 귀하께서 요청하신 민원은 \"{complaint.summary}\"에 관한 것으로 이해됩니다.\n"
    )

    # 📌 여기에서 LLM 호출
    generated_core = generate_llm_reply(complaint.reply_summary)
    # generated_core = [{"index": "가로등 고장으로 통행 불편 및 안전 위험에 관하여 아래와 같이 답변드립니다.", "section": [{"title": "가", "text": "귀하께서 신고하신 가로등 수리 작업은 조속한 시일 내 완료될 예정입니다."}]}]

    fixed_footer = (
        f" 기타 궁금하신 사항은 {user_info.department}({user_info.name}, "
        f"{user_info.contact})로 문의하여 주시면 성심껏 답변드리겠습니다. 감사합니다."
    )

    reply_content = {
        "header": fixed_header,
        "summary": fixed_summary,
        "body": generated_core,
        "footer": fixed_footer
    }


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

# 7. 답변 재생산(LLM) 라우터 
# 기존 [reply]데이터 삭제 후, [complaint]의 reply_summary를 input하여 [reply] 데이터 생성
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
    " 평소 구정에 관심을 가져주신데 대해 감사드립니다.\n"
    )
    fixed_summary = (
        f" 귀하께서 요청하신 민원은 \"{complaint.summary}\"에 관한 것으로 이해됩니다.\n"
    )
    fixed_footer = (
        f" 기타 궁금하신 사항은 {user_info.department}({user_info.name}, "
        f"{user_info.contact})로 문의하여 주시면 성심껏 답변드리겠습니다. 감사합니다."
    )
    generated_core = generate_llm_reply(complaint.reply_summary)
    # generated_core = [{"index": "가로등 고장으로 통행 불편 및 안전 위험에 관하여 아래와 같이 답변드립니다.", "section": [{"title": "가", "text": "귀하께서 신고하신 가로등 수리 작업은 조속한 시일 내 완료될 예정입니다."}]}]
    reply_content = {
        "header": fixed_header,
        "summary": fixed_summary,
        "body": generated_core,
        "footer": fixed_footer
    }

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

# 8. 응답 수정(컴플레인 아이디로 )
# 기록된 [reply]의 content 수정
@router.put("/complaints/{complaint_id}/reply", response_model=ReplyBase)
def update_reply(
    complaint_id: int,
    content: Any=Body(...),
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

# 9. 답변 검색(컴플레인 아이디로)
# 해당하는 [reply] 반환
#수정할까말까 -> 현재 하나만 반환해도 되는
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

# 8. 관리자용 답변 조회
# 모든 유저의 답변 반환
@router.get("/admin/replies", response_model=List[ReplyBase])
def get_all_replies(
    db: Session = Depends(get_db)
):
    replies = db.query(Reply).all()
    return replies


# 9. 민원 요약(LLM) 라우터(없으면 생성 후 반환)
#[complaint]의 content를 input하여  LLM모델로 summary 생성
@router.get("/complaints/{id}/summary", response_model=ComplaintSummaryResponse)
def get_complaint_summary(
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

    # 요약이 없을 때만 생성
    if not complaint.summary:
        complaint_summary = summarize_with_blossom(complaint.content)
        complaint.summary = complaint_summary
        db.commit()
        db.refresh(complaint)
    else:
        complaint_summary = complaint.summary

    # 긴 요약이 없을 때만 생성
    if not complaint.long_summary:
        complaint_long_summary = summarize_with_blossom(complaint.content)
        complaint.long_summary = complaint_long_summary
        db.commit()
        db.refresh(complaint)
    else:
        complaint_long_summary = complaint.long_summary

    return ComplaintSummaryResponse(
        title=complaint.title,
        content=complaint.content,
        summary=complaint_summary,
        long_summary=complaint_long_summary
    )


# 10. 답변 요약 호출 라우터 
# [complaint] id 기준으로 답변 요약, 제목, 민원 반환
@router.get("/complaints/{id}/reply-summary", response_model=ComplaintReplySummaryResponse)
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

    return ComplaintReplySummaryResponse(
        title=complaint.title,
        content=complaint.content,
        summary=complaint.reply_summary
    )


@router.put("/complaints/{id}/reply-summary", response_model=ResponseMessage)
def update_reply_summary(
    id: int,
    data: ReplySummaryUpdateRequest,
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
    complaint.reply_summary = data.answer_summary
    db.commit()
    db.refresh(complaint)

    return ResponseMessage(message="Reply summary updated successfully!")

@router.post("/complaints/{id}/reply-summary", response_model=ResponseMessage)
def save_reply_summary(
    id: int,
    req: ReplySummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원을 찾을 수 없습니다.")

    # JSON 형태 그대로 저장 (필드가 Text 또는 JSON 타입이어야 함)
    import json
    complaint.reply_summary = json.dumps(
        [item.dict() for item in req.answer_summary], 
        ensure_ascii=False
    )
    db.commit()
    return {"message": "답변요지가 저장되었습니다."}



# @router.get("/complaints/{id}/reply-options", response_model=List[ReplyBase])
# def get_reply_options(id: int, db: Session = Depends(get_db)):
#     # 해당 민원에 대한 모든 답변 조회
#     replies = db.query(Reply).filter(Reply.complaint_id == id).all()
#     if not replies:
#         raise HTTPException(status_code=404, detail="No replies found for this complaint")
    
#     return replies



@router.get("/complaints/{id}/history-similar", response_model=list[dict])
def get_similar_histories(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1) 본인 민원 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    # 2) 기존 저장된 결과 있으면 반환
    existing = db.query(SimilarHistory).filter(SimilarHistory.complaint_id == id).all()
    if existing:
        logger.info(f"[유사민원] complaint_id={id} → 저장된 {len(existing)}건 반환")
        def _safe_load(s):
            try:
                return json.loads(s) if isinstance(s, str) else s
            except:
                return {"raw": s}
        return [{"title": x.title, "summary": x.summary, "content": _safe_load(x.content)} for x in existing]

    # 3) 요약 없으면 빈 배열
    if not complaint.summary:
        logger.warning(f"[유사민원] complaint_id={id} → summary 없음 → 빈 배열 반환")
        return []

    rows = []
    summary_txt = complaint.summary

    # ---------- (A) pg_trgm 사용 시도 ----------
    try:
        # superuser 아니면 실패 가능 → 무시
        try:
            db.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            db.commit()
        except Exception as ext_e:
            db.rollback()
            logger.warning(f"[유사민원] pg_trgm 활성화 실패(무시): {ext_e}")

        sql_trgm = text("""
            SELECT title, summary, reply_content
            FROM complaint_history
            WHERE summary IS NOT NULL
              AND reply_content IS NOT NULL
            ORDER BY similarity(
                COALESCE(title,'') || ' ' || COALESCE(summary,''),
                CAST(:input_summary AS text)
            ) DESC
            LIMIT 3
        """)
        rows = db.execute(sql_trgm, {"input_summary": summary_txt}).fetchall()
        logger.info(f"[유사민원] pg_trgm(similarity)로 {len(rows)}건 조회")
    except Exception as e_trgm:
        db.rollback()
        logger.warning(f"[유사민원] similarity 실패 → FTS로 대체: {e_trgm}")

        # ---------- (B) Full-Text Search 폴백 ----------
        try:
            sql_fts = text("""
                SELECT title, summary, reply_content
                FROM complaint_history
                WHERE summary IS NOT NULL
                  AND reply_content IS NOT NULL
                ORDER BY ts_rank_cd(
                    to_tsvector('simple', COALESCE(title,'') || ' ' || COALESCE(summary,'')),
                    plainto_tsquery('simple', CAST(:input_summary AS text))
                ) DESC
                LIMIT 3
            """)
            rows = db.execute(sql_fts, {"input_summary": summary_txt}).fetchall()
            logger.info(f"[유사민원] FTS로 {len(rows)}건 조회")
        except Exception as e_fts:
            db.rollback()
            logger.error(f"[유사민원] FTS 실패 → 최신 3건으로 대체: {e_fts}")

            # ---------- (C) 최종 폴백: 최신 3건 ----------
            try:
                sql_recent = text("""
                    SELECT title, summary, reply_content
                    FROM complaint_history
                    WHERE summary IS NOT NULL
                      AND reply_content IS NOT NULL
                    ORDER BY id DESC
                    LIMIT 3
                """)
                rows = db.execute(sql_recent).fetchall()
                logger.info(f"[유사민원] 최신 3건으로 {len(rows)}건 조회")
            except Exception as e_recent:
                db.rollback()
                logger.exception("[유사민원] 최신 3건 조회까지 실패 → 빈 배열 반환")
                return []

    # 4) 새로 찾은 결과 저장 (JSON 안전 처리)
    def _ensure_json(value):
        if isinstance(value, (dict, list)):
            return json.dumps(value, ensure_ascii=False)
        try:
            json.loads(value)  # 이미 JSON 문자열이면 통과
            return value
        except Exception:
            return json.dumps({"raw": str(value)}, ensure_ascii=False)

    try:
        for r in rows:
            db.add(SimilarHistory(
                complaint_id=id,
                title=r.title,
                summary=r.summary,
                content=_ensure_json(r.reply_content)
            ))
        db.commit()
    except Exception as e_save:
        db.rollback()
        logger.warning(f"[유사민원] 결과 저장 실패(무시): {e_save}")

    # 5) 응답 구성 (JSON 안전 파싱)
    def safe_json(value):
        if isinstance(value, (dict, list)):
            return value
        try:
            return json.loads(value)
        except Exception:
            return {"raw": str(value)}

    return [
        {
            "title": r.title,
            "summary": r.summary,
            "content": safe_json(r.reply_content)
        }
        for r in rows
    ]

@router.get("/admin/public-histories", response_model=List[ReplyBase])
def get_public_histories(db: Session = Depends(get_db)):
    histories = db.query(ComplaintHistory).filter(ComplaintHistory.is_public == True).limit(10).all()

    return [
        ReplyBase(
            id=history.id,
            complaint_id=history.id,  # 또는 연결된 complaint_id가 따로 있으면 그것으로 대체
            created_at=history.created_at,
            title=history.title,
            summary=history.summary or "",
            content=history.reply_content or ""
        )
        for history in histories
    ]



@router.put("/complaints/{id}/reply-status", response_model=ResponseMessage)
def update_reply_status(
    id: int,
    data: ReplyStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1) 본인 민원 확인
    complaint = db.query(Complaint).filter(
        Complaint.id == id,
        Complaint.user_uid == current_user.user_uid
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="해당 민원이 없거나 권한이 없습니다.")

    # 2) 상태 유효성 검증
    allowed_status = {"답변전", "수정중", "답변완료"}
    if data.status not in allowed_status:
        raise HTTPException(status_code=400, detail=f"상태는 {allowed_status} 중 하나여야 합니다.")

    # 3) 상태 변경
    complaint.reply_status = data.status
    db.commit()
    db.refresh(complaint)

    # 4) 답변완료 시 별점 입력 로직
    if data.status == "답변완료":
        latest_reply = (
            db.query(Reply)
            .filter(Reply.complaint_id == id)
            .order_by(Reply.created_at.desc())
            .first()
        )
        if not latest_reply:
            raise HTTPException(status_code=404, detail="해당 민원의 답변을 찾을 수 없습니다.")

        # ★ 별점 값 확인 (요청 데이터에 rating이 포함돼야 함)
        if data.rating not in {1, 2, 3}:
            raise HTTPException(status_code=400, detail="별점은 1, 2, 3 중 하나여야 합니다.")

        latest_reply.rating = data.rating
        db.commit()
        db.refresh(latest_reply)

        return ResponseMessage(
            message=f"답변 상태가 '답변완료'로 변경되었으며, 별점 {data.rating}점이 등록되었습니다."
        )

    return ResponseMessage(message=f"답변 상태가 '{data.status}'(으)로 변경되었습니다.")

class RatingResponse(BaseModel):
    complaint_id: int
    reply_id: int
    rating: Optional[int] = None  # 아직 미평가면 null
    class Config:
        orm_mode = True


#별점 디버깅용 (답변아이디로 조회)
@router.get("/replies/{reply_id}/rating", response_model=RatingResponse)
def get_reply_rating_by_reply_id(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reply = (
        db.query(Reply)
        .join(Complaint, Reply.complaint_id == Complaint.id)
        .filter(Reply.id == reply_id, Complaint.user_uid == current_user.user_uid)
        .first()
    )
    if not reply:
        raise HTTPException(status_code=404, detail="해당 답변을 찾을 수 없거나 권한이 없습니다.")

    return RatingResponse(
        complaint_id=reply.complaint_id,
        reply_id=reply.id,
        rating=reply.rating
    )