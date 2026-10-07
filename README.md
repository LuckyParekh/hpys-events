# HPYS Events App

Web app for Hariprabodham Youths Sabha Scarborough to manage and archive bi-weekly gatherings.

## Quick Start

### Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Features
- Paste a YouTube URL → auto-extract thumbnail, topic, and date
- Speaker (Vakta) directory with profiles and event history
- Audio download from YouTube after the event ends
- Topics browser
- Upcoming & Past events with search

## Tech Stack
- Backend: Python + FastAPI + SQLite + yt-dlp
- Frontend: React + Vite + Tailwind CSS
- All completely free, no paid APIs required
