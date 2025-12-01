from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.sql import expression
from typing import List
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintHistory
from app.models.reply import Reply
from app.models.user import User
from app.schemas.complaint_history import ComplaintHistoryResponse, HistorySimpleContent
from app.schemas.reply import SimpleContent
from app.schemas.response_message import ResponseMessage
from app.auth import get_current_user
import pandas as pd
import io 
from fastapi.responses import StreamingResponse
from sqlalchemy import asc, desc
from sqlalchemy.sql import expression
try:
    # SQLAlchemy 2.x
    from sqlalchemy import nulls_last
except ImportError:
    nulls_last = None

router = APIRouter()

def format_reply_content(content: dict) -> str:
    """
    reply.content / history.reply_content 를
    엑셀용 단일 문자열로 변환하는 공통 함수
    구조:
      1. header
      2. summary
      3. index (본문 항목들)
         - title 있으면: "가. 내용"
         - title 없으면: "• 내용"
      N. footer
    """
    if not isinstance(content, dict):
        return str(content)

    lines = []
    idx = 1

    # 1) header
    header = (content.get("header") or "").strip()
    if header:
        lines.append(f"{idx}. {header}")
        idx += 1

    # 2) summary
    summary = (content.get("summary") or "").strip()
    if summary:
        lines.append(f"{idx}. {summary}")
        idx += 1

    # 3) body
    body = content.get("body", [])
    # body 가 dict 로 들어오는 예외 방지
    if isinstance(body, dict):
        body = [body]

    for item in body:
        if not isinstance(item, dict):
            continue

        index = (item.get("index") or "").strip()
        if index:
            lines.append(f"{idx}. {index}")
            idx += 1

        for section in item.get("section", []):
            if not isinstance(section, dict):
                continue

            title = (section.get("title") or "").strip()
            text = (section.get("text") or "").strip()

            # title + text 둘 다 있으면: "가. 내용"
            if title and text:
                lines.append(f"{title} {text}")
            # title 없이 text만 있으면: "• 내용"
            elif text:
                lines.append(f"• {text}")
            # 둘 다 없으면 출력 X

    # 4) footer
    footer = (content.get("footer") or "").strip()
    if footer:
        lines.append(f"{idx}. {footer}")

    return "\n".join(lines)


# 0. 히스토리 엑셀 다운로드 라우터
@router.get("/history/download-excel")
def download_complaint_history_excel(
    ids: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    id_list = [int(i) for i in ids.split(",") if i.isdigit()]

    if not id_list:
        raise HTTPException(status_code=400, detail="유효한 히스토리 ID 목록을 전달해주세요.")

    histories = db.query(ComplaintHistory).filter(
        ComplaintHistory.user_uid == current_user.user_uid,
        ComplaintHistory.id.in_(id_list)
    ).all()

    if not histories:
        raise HTTPException(status_code=404, detail="조회된 히스토리가 없습니다.")

    rows = []
    for history in histories:
        rows = []
    for history in histories:
        # reply_content는 JSONB → 표준 포맷으로 변환
        reply_text = "(답변 없음)"

        raw = history.reply_content
        if raw:
            parsed = None

            # 1) 이미 dict 인 경우
            if isinstance(raw, dict):
                parsed = raw
            else:
                # 2) JSON 문자열인 경우 파싱 시도
                try:
                    parsed = json.loads(raw)
                except Exception:
                    parsed = None

            if parsed is not None:
                # 표준 포맷팅 (header/summary/body/footer)
                reply_text = format_reply_content(parsed)
            else:
                # 어떻게든 안 되면 raw 그대로 문자열화
                reply_text = str(raw)

        rows.append({
            "제목": history.title,
            "내용": history.content,
            "등록일": history.created_at.strftime("%Y-%m-%d %H:%M:%S") if history.created_at else "",
            "공개 여부": "공개" if history.is_public else "비공개",
            "답변": reply_text,
            "평가": history.rating if history.rating else "",
        })

    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='히스토리내역')

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=complaint_history.xlsx"}
    )



#  1. 검색 (가장 먼저)
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

# 2. 히스토리 전체 조회 (정렬 + 상태 필터)
@router.get("/complaints/history", response_model=List[ComplaintHistoryResponse])
def get_complaint_history(
    sort: str = Query("created_desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ComplaintHistory).filter(
        ComplaintHistory.user_uid == current_user.user_uid
    )

    sort = (sort or "created_desc").lower()

    if sort == "created_asc":
        q = q.order_by(asc(ComplaintHistory.created_at))

    elif sort == "rating_desc":
        if nulls_last:
            q = q.order_by(nulls_last(desc(ComplaintHistory.rating)))
        else:
            q = q.order_by(ComplaintHistory.rating.is_(None), desc(ComplaintHistory.rating))

    elif sort == "rating_asc":
        if nulls_last:
            q = q.order_by(nulls_last(asc(ComplaintHistory.rating)))
        else:
            q = q.order_by(ComplaintHistory.rating.is_(None), asc(ComplaintHistory.rating))

    else:  # 기본값: created_desc
        q = q.order_by(desc(ComplaintHistory.created_at))

    return q.all()
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
        reply_rating = reply.rating if reply else None

        history = ComplaintHistory(
            user_uid=complaint.user_uid,
            title=complaint.title,
            summary=complaint.summary,
            content=complaint.content,
            is_public=complaint.is_public,
            created_at=complaint.created_at,
            reply_summary=complaint.reply_summary,
            reply_content=reply_content,
            rating=reply_rating
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

# 7. 테스트용 히소토리 아이디로 별점 조회
class HistoryRatingResponse(BaseModel):
    history_id: int
    rating: Optional[int] = None  # 미평가면 null
    class Config:
        orm_mode = True

@router.get("/complaint-histories/{history_id}/rating", response_model=HistoryRatingResponse)
def get_history_rating(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hist = (
        db.query(ComplaintHistory)
        .filter(
            ComplaintHistory.id == history_id,
            ComplaintHistory.user_uid == current_user.user_uid,  # 소유권 확인
        )
        .first()
    )
    if not hist:
        raise HTTPException(status_code=404, detail="해당 히스토리를 찾을 수 없거나 권한이 없습니다.")

    return HistoryRatingResponse(history_id=hist.id, rating=hist.rating)


# 8. 히스토리 다건 삭제
@router.delete("/complaints/history", response_model=ResponseMessage)
def delete_complaint_histories(
    ids: str = Query(..., min_length=1, pattern=r"^\d+(,\d+)*$", description="예: 1,2,3"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1) 파싱
    id_list = [int(x) for x in ids.split(",")]

    # 2) 현재 사용자 소유의 대상만 선택
    q = (
        db.query(ComplaintHistory)
        .filter(
            ComplaintHistory.user_uid == current_user.user_uid,
            ComplaintHistory.id.in_(id_list),
        )
    )

    # 3) 실제 존재/소유 레코드 수 확인
    target_ids = [h.id for h in q.all()]
    if not target_ids:
        raise HTTPException(status_code=404, detail="삭제할 히스토리가 없거나 권한이 없습니다.")

    # 4) 일괄 삭제
    try:
        (
            db.query(ComplaintHistory)
            .filter(
                ComplaintHistory.user_uid == current_user.user_uid,
                ComplaintHistory.id.in_(target_ids),
            )
            .delete(synchronize_session=False)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"삭제 실패: {str(e)}")

    # 5) 결과 메시지 (요청했지만 미존재/무권한 목록도 안내)
    missing_or_forbidden = sorted(set(id_list) - set(target_ids))
    if missing_or_forbidden:
        msg = f"총 {len(target_ids)}건 삭제 완료. (삭제 제외: {missing_or_forbidden})"
    else:
        msg = f"총 {len(target_ids)}건 삭제 완료."

    return ResponseMessage(message=msg)