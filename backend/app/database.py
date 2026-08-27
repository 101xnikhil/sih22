from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

# SQLite connection with thread checking disabled for FastAPI async workers
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True,
)

# Enable WAL mode & busy timeout for concurrent SQLite reads and writes
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in settings.DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    """Create tables and execute migrations if needed."""
    try:
        import app.models  # Ensure all model classes are registered with Base metadata
    except Exception:
        pass
    Base.metadata.create_all(bind=engine)
    if "sqlite" in settings.DATABASE_URL:
        from sqlalchemy import text
        with engine.connect() as conn:
            for col_sql in [
                "ALTER TABLE alerts ADD COLUMN trigger_reason TEXT;",
                "ALTER TABLE alerts ADD COLUMN created_at DATETIME;",
            ]:
                try:
                    conn.execute(text(col_sql))
                    conn.commit()
                except Exception:
                    pass


# Initialize tables and migrations on load
init_db()


def get_db():
    """Dependency for obtaining a database session per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
