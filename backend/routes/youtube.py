from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yt_dlp
import re

router = APIRouter(prefix="/api/youtube", tags=["youtube"])


class YouTubeParseRequest(BaseModel):
    url: str


def extract_video_id(url: str) -> str | None:
    patterns = [
        r"(?:v=|youtu\.be/|embed/|live/)([A-Za-z0-9_-]{11})",
        r"^([A-Za-z0-9_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def parse_topic_from_title(title: str) -> str:
    """
    Title format: 'Channel Name - Topic - Date'
    or: 'Channel Name- Topic- Date'
    Extract the middle part as the topic.
    """
    # Remove common channel prefix patterns
    prefixes = [
        "Hariprabodham Youths Sabha Scarborough",
        "Hariprabodham Youth Sabha Scarborough",
        "HPYS",
    ]
    cleaned = title
    for prefix in prefixes:
        if cleaned.lower().startswith(prefix.lower()):
            cleaned = cleaned[len(prefix):]
            break

    # Split on dash separators
    parts = re.split(r"\s*[-–]\s*", cleaned)
    parts = [p.strip() for p in parts if p.strip()]

    if not parts:
        return title

    # The topic is usually the first meaningful part after the channel name
    # The last part often looks like a date (month/year pattern)
    date_pattern = re.compile(
        r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|\d{1,2}(st|nd|rd|th)?)",
        re.IGNORECASE,
    )

    # If last part looks like a date, skip it
    topic_parts = []
    for part in parts:
        if not date_pattern.search(part):
            topic_parts.append(part)
        # Keep date-like parts only if nothing else found

    if topic_parts:
        return topic_parts[0]
    elif parts:
        return parts[0]
    return title


def parse_date_from_title(title: str) -> str | None:
    """Extract date string from video title."""
    # Match patterns like 'Aug 20, 2026', 'August 20 2026', 'Jan 8th, 2026'
    date_pattern = re.compile(
        r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
        r"jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
        r"\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}",
        re.IGNORECASE,
    )
    match = date_pattern.search(title)
    if match:
        return match.group(0)
    return None


@router.post("/parse")
async def parse_youtube_url(request: YouTubeParseRequest):
    url = request.url.strip()

    video_id = extract_video_id(url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Could not extract video ID from URL")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch YouTube data: {str(e)}")

    title = info.get("title", "")
    upload_date = info.get("upload_date")  # YYYYMMDD format
    duration = info.get("duration")

    # Best quality thumbnail
    thumbnails = info.get("thumbnails", [])
    thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    if thumbnails:
        # Pick highest resolution
        best = max(thumbnails, key=lambda t: (t.get("width") or 0) * (t.get("height") or 0))
        thumbnail_url = best.get("url", thumbnail_url)

    topic = parse_topic_from_title(title)
    date_from_title = parse_date_from_title(title)

    # Format upload date nicely
    formatted_date = None
    if upload_date:
        try:
            from datetime import datetime
            d = datetime.strptime(upload_date, "%Y%m%d")
            formatted_date = d.strftime("%B %d, %Y")
        except Exception:
            pass

    event_date = date_from_title or formatted_date

    return {
        "video_id": video_id,
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
        "title": title,
        "topic": topic,
        "event_date": event_date,
        "thumbnail_url": thumbnail_url,
        "duration": duration,
        "channel": info.get("channel", ""),
    }
