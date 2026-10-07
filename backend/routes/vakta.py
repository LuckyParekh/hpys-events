from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, Vakta, User
from pydantic import BaseModel
from typing import Optional
import shutil, os, uuid
from routes.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/vakta", tags=["vakta"])

MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "media", "vakta")
os.makedirs(MEDIA_DIR, exist_ok=True)


def vakta_to_dict(v: Vakta) -> dict:
    return {
        "id": v.id,
        "name": v.name,
        "photo_url": v.photo_url,
        "bio": v.bio,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }


@router.get("/")
def list_vakta(db: Session = Depends(get_db)):
    speakers = db.query(Vakta).order_by(Vakta.name).all()
    return [vakta_to_dict(v) for v in speakers]


@router.get("/{vakta_id}")
def get_vakta(vakta_id: int, db: Session = Depends(get_db)):
    v = db.query(Vakta).filter(Vakta.id == vakta_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vakta not found")
    data = vakta_to_dict(v)
    # Include their events (as speaker 1 or speaker 2)
    from database import Event
    events = (
        db.query(Event)
        .filter((Event.vakta_id == vakta_id) | (Event.vakta_id_2 == vakta_id))
        .order_by(Event.event_date.desc())
        .all()
    )
    data["events"] = [event_to_dict(e) for e in events]
    return data


@router.post("/")
async def create_vakta(
    name: str = Form(...),
    bio: str = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    photo_url = None
    if photo and photo.filename:
        ext = os.path.splitext(photo.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(MEDIA_DIR, filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(photo.file, f)
        photo_url = f"/media/vakta/{filename}"

    v = Vakta(name=name, bio=bio, photo_url=photo_url)
    db.add(v)
    db.commit()
    db.refresh(v)
    return vakta_to_dict(v)


@router.put("/{vakta_id}")
async def update_vakta(
    vakta_id: int,
    name: str = Form(...),
    bio: str = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    v = db.query(Vakta).filter(Vakta.id == vakta_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vakta not found")

    v.name = name
    v.bio = bio

    if photo and photo.filename:
        ext = os.path.splitext(photo.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(MEDIA_DIR, filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(photo.file, f)
        v.photo_url = f"/media/vakta/{filename}"

    db.commit()
    db.refresh(v)
    return vakta_to_dict(v)


@router.delete("/{vakta_id}")
def delete_vakta(vakta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Vakta).filter(Vakta.id == vakta_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vakta not found")
    db.delete(v)
    db.commit()
    return {"ok": True}


def event_to_dict(e) -> dict:
    return {
        "id": e.id,
        "title": e.title,
        "topic": e.topic,
        "event_date": e.event_date,
        "thumbnail_url": e.thumbnail_url,
        "category": e.category,
        "status": e.status,
        "youtube_url": e.youtube_url,
        "video_id": e.video_id,
        "audio_url": e.audio_url,
        "summary": e.summary,
        "vakta_id": e.vakta_id,
    }
