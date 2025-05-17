from app.database import Base, engine
from sqlalchemy import inspect, text



Base.metadata.create_all(bind=engine)
print("모든 테이블 재생성 완료")
