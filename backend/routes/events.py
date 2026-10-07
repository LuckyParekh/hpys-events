from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, Event, Vakta, User
from pydantic import BaseModel
from typing import Optional
import os, subprocess
from routes.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/events", tags=["events"])

MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "media")
os.makedirs(MEDIA_DIR, exist_ok=True)


def event_to_dict(e: Event, include_vakta: bool = True) -> dict:
    data = {
        "id": e.id,
        "event_type": e.event_type or "sabha",
        "youtube_url": e.youtube_url,
        "video_id": e.video_id,
        "title": e.title,
        "topic": e.topic,
        "category": e.category,
        "description": e.description,
        "summary": e.summary,
        "event_date": e.event_date,
        "thumbnail_url": e.thumbnail_url,
        "address": e.address,
        "sabha_style": e.sabha_style,
        "audio_url": e.audio_url,
        "status": e.status,
        "featured": e.featured,
        "vakta_id": e.vakta_id,
        "vakta_id_2": e.vakta_id_2,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }
    if include_vakta:
        data["vakta"] = {
            "id": e.vakta.id,
            "name": e.vakta.name,
            "photo_url": e.vakta.photo_url,
        } if e.vakta else None
        data["vakta2"] = {
            "id": e.vakta2.id,
            "name": e.vakta2.name,
            "photo_url": e.vakta2.photo_url,
        } if e.vakta2 else None
    else:
        data["vakta"] = None
        data["vakta2"] = None
    return data


class EventCreate(BaseModel):
    event_type: str = "sabha"
    youtube_url: Optional[str] = None
    video_id: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    category: str = "Scarborough Sabha"
    description: Optional[str] = None
    event_date: Optional[str] = None
    address: Optional[str] = None
    thumbnail_url: Optional[str] = None
    sabha_style: Optional[str] = None
    vakta_id: Optional[int] = None
    vakta_id_2: Optional[int] = None
    audio_url: Optional[str] = None
    status: str = "upcoming"
    featured: bool = False


class EventUpdate(BaseModel):
    event_type: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[str] = None
    address: Optional[str] = None
    thumbnail_url: Optional[str] = None
    sabha_style: Optional[str] = None
    vakta_id: Optional[int] = None
    vakta_id_2: Optional[int] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    audio_url: Optional[str] = None
    summary: Optional[str] = None
    youtube_url: Optional[str] = None


@router.get("/")
def list_events(
    status: Optional[str] = None,
    search: Optional[str] = None,
    vakta_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Event)
    if status:
        q = q.filter(Event.status == status)
    if vakta_id:
        q = q.filter((Event.vakta_id == vakta_id) | (Event.vakta_id_2 == vakta_id))
    if search:
        term = f"%{search}%"
        q = q.outerjoin(Vakta, (Event.vakta_id == Vakta.id))
        # alias for second speaker join
        from sqlalchemy.orm import aliased
        Vakta2 = aliased(Vakta)
        q = q.outerjoin(Vakta2, (Event.vakta_id_2 == Vakta2.id))
        q = q.filter(
            Event.title.ilike(term)
            | Event.topic.ilike(term)
            | Event.description.ilike(term)
            | Event.event_date.ilike(term)
            | Event.category.ilike(term)
            | Event.sabha_style.ilike(term)
            | Event.address.ilike(term)
            | Vakta.name.ilike(term)
            | Vakta2.name.ilike(term)
        )
    events = q.order_by(Event.created_at.desc()).all()
    return [event_to_dict(e) for e in events]


@router.get("/topics")
def list_topics(db: Session = Depends(get_db)):
    """Return all unique topics with their event counts."""
    from sqlalchemy import func
    rows = (
        db.query(Event.topic, func.count(Event.id).label("count"))
        .filter(Event.topic.isnot(None))
        .group_by(Event.topic)
        .order_by(Event.topic)
        .all()
    )
    return [{"topic": r.topic, "count": r.count} for r in rows]


@router.get("/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    return event_to_dict(e)


@router.post("/")
def create_event(payload: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    data = payload.model_dump()
    # The existing DB may have youtube_url as NOT NULL (old schema); default to "" to satisfy it
    data["youtube_url"] = data.get("youtube_url") or ""
    e = Event(**data)
    db.add(e)
    db.commit()
    db.refresh(e)
    return event_to_dict(e)


@router.put("/{event_id}")
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(e, field, value)
    db.commit()
    db.refresh(e)
    return event_to_dict(e)


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(e)
    db.commit()
    return {"ok": True}


def _download_audio_task(event_id: int, youtube_url: str):
    """Background task: download audio with yt-dlp, update DB."""
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from database import SessionLocal, Event as EventModel

    audio_dir = os.path.join(MEDIA_DIR, "audio")
    os.makedirs(audio_dir, exist_ok=True)
    output_template = os.path.join(audio_dir, f"event_{event_id}.%(ext)s")

    import yt_dlp
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "quiet": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])

        audio_file = os.path.join(audio_dir, f"event_{event_id}.mp3")
        if os.path.exists(audio_file):
            db = SessionLocal()
            e = db.query(EventModel).filter(EventModel.id == event_id).first()
            if e:
                e.audio_url = f"/media/audio/event_{event_id}.mp3"
                e.status = "past"
                db.commit()
            db.close()
    except Exception as ex:
        print(f"Audio download failed for event {event_id}: {ex}")


@router.post("/{event_id}/download-audio")
def download_audio(
    event_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    if e.audio_url:
        return {"message": "Audio already exists for this event."}
    if not e.youtube_url:
        raise HTTPException(status_code=400, detail="No YouTube URL set for this event.")
    background_tasks.add_task(_download_audio_task, event_id, e.youtube_url)
    return {"message": "Audio download started in background. Check back in a few minutes."}
