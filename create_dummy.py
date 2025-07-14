from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.user_info import UserInfo
from app.models.complaint import Complaint
from app.models.reply import Reply
from app.models.user_reply_history import UserReplyHistory
from datetime import datetime, timedelta
import random

# === 비밀번호 해시 함수 추가 ===
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# === 더미 데이터 ===
questions = [
    "어머니 성함은?",
    "첫 애완동물 이름은?",
    "졸업한 초등학교는?",
]

answers = [
    "김영희",
    "토토",
    "동아초등학교",
]

users_data = [
    ("user01", "홍길동", "hong@example.com", "010-1111-2222", "개발팀"),
    ("user02", "김철수", "kimc@example.com", "010-3333-4444", "기획팀"),
    ("user03", "이영희", "leey@example.com", "010-5555-6666", "마케팅팀"),
]

complaint_samples = [
    ("가로등 고장", "우리 동네 가로등이 3일째 고장났어요."),
    ("도로 파임", "집 앞 도로가 너무 파여서 위험합니다."),
    ("쓰레기 무단 투기", "공원 근처에 쓰레기 무단 투기가 심해요."),
    ("소음 문제", "새벽 시간대 이웃집에서 너무 시끄럽습니다."),
    ("상수도 누수", "집 앞 상수도관에서 물이 새고 있습니다."),
    ("쓰레기봉투 미수거", "쓰레기봉투가 2일째 수거되지 않았습니다."),
    ("버스노선 변경 요청", "출퇴근 버스 노선 변경을 요청합니다."),
    ("공원 조명 고장", "공원 조명이 일부 고장났습니다."),
    ("도로 불법 주차", "도로변 불법 주차 차량이 많습니다."),
    ("가로수 가지치기 요청", "가로수 가지가 지나치게 자랐습니다."),
]

def create_dummy_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 사용자 및 상세정보 생성
        for idx, (user_id, name, email, contact, dept) in enumerate(users_data):
            user_uid = testid
            user = User(
                user_uid=user_uid,
                user_id=user_id,
                name=name,
                password=hash_password("1234"),  # 비밀번호 해시 저장
                question=random.choice(questions),
                answer=random.choice(answers)
            )
            db.add(user)
            db.flush()

            user_info = UserInfo(
                user_uid=user_uid,
                name=name,
                department=dept,
                contact=contact,
                email=email,
            )
            db.add(user_info)

        db.commit()

        # 민원 및 답변 생성 (사용자당 10개 민원)
        users = db.query(User).all()
        for user in users:
            for _ in range(10):  # 10개 민원 생성
                title, content = random.choice(complaint_samples)
                created_at = datetime.utcnow() - timedelta(days=random.randint(0, 60))
                complaint = Complaint(
                    user_uid=user.user_uid,
                    title=title,
                    content=content,
                    is_public=random.choice([True, False]),
                    created_at=created_at,
                    summary=content[:50] + "...",
                    reply_summary=None,
                    reply_status="답변전",
                )
                db.add(complaint)
                db.flush()

                if random.choice([True, False]):
                    reply_content = f"답변: {title} 문제에 대해 처리하겠습니다."
                    reply = Reply(
                        complaint_id=complaint.id,
                        content=reply_content,
                        user_uid=user.user_uid,
                        created_at=created_at + timedelta(hours=1)
                    )
                    db.add(reply)

                    if random.choice([True, False]):
                        history = UserReplyHistory(
                            user_uid=user.user_uid,
                            reply=reply,
                            final_content=reply_content,
                            used_at=created_at + timedelta(hours=2)
                        )
                        db.add(history)

        db.commit()
        print("더미 데이터 생성 완료")
    finally:
        db.close()

if __name__ == "__main__":
    create_dummy_data()
