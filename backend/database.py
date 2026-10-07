import os
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.pool import StaticPool
from datetime import datetime

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
    # Production: connect to Turso (cloud SQLite)
    import libsql_experimental as libsql

    def _make_turso_connection():
        conn = libsql.connect(
            database=":memory:",
            sync_url=TURSO_DATABASE_URL,
            auth_token=TURSO_AUTH_TOKEN,
        )
        conn.sync()
        return conn

    engine = create_engine(
        "sqlite+pysqlite://",
        creator=_make_turso_connection,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
else:
    # Local development: plain SQLite file
    engine = create_engine(
        "sqlite:///./hpys.db",
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=True)
    pin_hash = Column(String, nullable=False)
    role = Column(String, default="viewer")  # "admin" | "viewer"
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Vakta(Base):
    __tablename__ = "vakta"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships defined on Event side; no back_populates needed here


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, default="sabha")   # sabha | gathering | outing | event
    youtube_url = Column(String, nullable=True)
    video_id = Column(String, nullable=True)
    title = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    category = Column(String, default="Scarborough Sabha")
    description = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    event_date = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    audio_path = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    status = Column(String, default="upcoming")   # upcoming | past
    featured = Column(Boolean, default=False)
    address = Column(String, nullable=True)
    sabha_style = Column(String, nullable=True)   # video | vakta | presentation | podcast
    vakta_id = Column(Integer, ForeignKey("vakta.id"), nullable=True)
    vakta_id_2 = Column(Integer, ForeignKey("vakta.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vakta = relationship("Vakta", foreign_keys="[Event.vakta_id]")
    vakta2 = relationship("Vakta", foreign_keys="[Event.vakta_id_2]")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    _migrate_db()


def _migrate_db():
    """Add new columns to existing tables if they don't exist (SQLite safe)."""
    migrations = [
        ("events", "event_type", "VARCHAR DEFAULT 'sabha'"),
        ("events", "vakta_id_2", "INTEGER REFERENCES vakta(id)"),
        ("events", "address", "VARCHAR"),
        ("events", "sabha_style", "VARCHAR"),
        ("users", "email", "VARCHAR"),
        ("users", "avatar_url", "VARCHAR"),
    ]
    try:
        with engine.connect() as conn:
            for table, col, col_def in migrations:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
                    conn.commit()
                except Exception:
                    pass  # Column already exists
    except Exception:
        pass  # Migration non-critical — tables will be created fresh by create_all
