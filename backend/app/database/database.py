from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# Engine: the object that talks to PostgreSQL using the .env connection string
engine = create_engine(settings.DATABASE_URL)

# SessionLocal: factory that creates database sessions (one per request)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    # All ORM models inherit from this so Alembic can discover their tables
    pass


def get_db():
    # FastAPI dependency: gives each request a session and closes it after
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
