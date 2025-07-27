from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User

def insert_dummy_users():
    db: Session = SessionLocal()
    dummy_data = [
        {"user_uid": "test-uid-0", "user_id": "testuser0", "name": "테스트유저0"},
        {"user_uid": "test-uid-1", "user_id": "testuser1", "name": "테스트유저1"},
        {"user_uid": "test-uid-2", "user_id": "testuser2", "name": "테스트유저2"},
    ]

    for data in dummy_data:
        exists = db.query(User).filter_by(user_uid=data["user_uid"]).first()
        if not exists:
            user = User(**data)
            db.add(user)

    db.commit()
    db.close()
    print("✅ 중복 없이 더미 유저 삽입 완료")

if __name__ == "__main__":
    insert_dummy_users()
