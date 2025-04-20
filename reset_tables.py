

from app.database import Base, engine
from app.models import user, user_info, complaint, reply, user_reply_history

# 모든 테이블 삭제
Base.metadata.drop_all(bind=engine)
print("모든 테이블 삭제 완료")

# 모든 테이블 재생성
Base.metadata.create_all(bind=engine)
print("모든 테이블 재생성 완료")
