from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from app.database import SQLALCHEMY_DATABASE_URL  # 데이터베이스 URL import

# Alembic Config 객체
config = context.config

# Logging 설정
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# SQLAlchemy 모델의 메타데이터 객체를 설정
# from app.models import Base  # 예시: Base 객체 import
# target_metadata = Base.metadata

target_metadata = None  # 이 부분을 필요에 맞게 수정하세요

# Run migrations in offline mode
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

# Run migrations in online mode
def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

# 실행 모드에 맞게 마이그레이션을 수행
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
