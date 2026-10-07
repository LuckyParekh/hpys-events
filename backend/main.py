from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, uuid, shutil
from dotenv import load_dotenv

load_dotenv()  # loads .env file when running locally

from database import init_db
from routes import youtube, events, vakta, auth

app = FastAPI(title="HPYS Events API")

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded media files
MEDIA_DIR = os.path.join(os.path.dirname(__file__), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

# Routes
app.include_router(auth.router)
app.include_router(youtube.router)
app.include_router(events.router)
app.include_router(vakta.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"status": "HPYS Events API running"}


@app.post("/api/media/upload")
async def upload_media(file: UploadFile = File(...)):
    """General-purpose image upload for event thumbnails etc."""
    thumbnails_dir = os.path.join(MEDIA_DIR, "thumbnails")
    os.makedirs(thumbnails_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(thumbnails_dir, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"/media/thumbnails/{filename}"}


@app.post("/api/media/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """Upload a pre-recorded audio file for an event."""
    audio_dir = os.path.join(MEDIA_DIR, "audio")
    os.makedirs(audio_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(audio_dir, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"/media/audio/{filename}"}
