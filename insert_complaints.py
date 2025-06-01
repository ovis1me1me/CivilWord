import json
from datetime import datetime
from app.database import SessionLocal
from app.models.complaint_history import ComplaintHistory

def clean_keys(entry: dict) -> dict:
    """
    'title__999' → 'title' 식으로 __ 이후를 잘라냄
    """
    return {k.split("__")[0]: v for k, v in entry.items()}

# ✅ JSON 불러오기
with open("converted_complaints.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

# ✅ 키 정제
cleaned_data = [clean_keys(entry) for entry in raw_data]

# ✅ DB 삽입
db = SessionLocal()
success_count = 0

for entry in cleaned_data:
    try:
        complaint = ComplaintHistory(
            user_uid=None,
            title=entry["title"],
            content=entry["content"],
            is_public=entry["is_public"],
            created_at=datetime.fromisoformat(entry["created_at"]),
            summary=entry.get("summary"),
            reply_summary=entry.get("reply_summary"),
            reply_status=entry.get("reply_status", "답변전"),
            reply_content=entry.get("reply_content"),
            moved_at=datetime.utcnow()
        )
        db.add(complaint)
        success_count += 1
    except Exception as e:
        print(f"[❌ 오류] 제목: {entry.get('title')} → {e}")

db.commit()
db.close()

print(f"✅ {success_count}건의 민원이 complaint_history 테이블에 삽입되었습니다.")
