from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite (간단한 테스트용. 추후 PostgreSQL로 변경 가능)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# DB 연결 엔진
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# DB 세션 (ORM에서 DB 작업할 때 사용)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base (모든 모델의 부모)
Base = declarative_base()
