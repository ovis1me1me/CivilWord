from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLAlchemy 엔진을 설정합니다.
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"  # 데이터베이스 URL (이 예시는 SQLite)

# 엔진 생성
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# 세션 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 생성
Base = declarative_base()
