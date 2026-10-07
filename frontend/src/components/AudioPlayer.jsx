import { useAudio } from "../lib/AudioContext";
import { useNavigate } from "react-router-dom";

function fmt(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AudioPlayer() {
  const { track, playing, currentTime, duration, togglePlay, seek, stop } = useAudio();
  const navigate = useNavigate();

  if (!track) return null;

  const progress = duration ? currentTime / duration : 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "57px",   // sit just above the bottom nav
        left: 0,
        right: 0,
        zIndex: 49,
        backgroundColor: "#111",
        borderTop: "1px solid #2a2a2a",
        padding: "10px 16px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "672px",
        margin: "0 auto",
      }}
    >
      {/* Progress bar */}
      <div
        style={{ position: "relative", height: "3px", backgroundColor: "#2a2a2a", borderRadius: "2px", cursor: "pointer" }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          seek(ratio * duration);
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            backgroundColor: "#EA580C",
            borderRadius: "2px",
            transition: "width 0.5s linear",
          }}
        />
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

        {/* Title — tap to go to event */}
        <div
          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
          onClick={() => navigate(`/events/${track.eventId}`)}
        >
          <p style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {track.title}
          </p>
          <p style={{ color: "#9B6E00", fontSize: "11px", marginTop: "1px" }}>
            {fmt(currentTime)} / {fmt(duration)}
          </p>
        </div>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#EA580C",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {playing ? (
            // Pause icon
            <svg style={{ width: "18px", height: "18px", color: "#fff" }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            // Play icon
            <svg style={{ width: "18px", height: "18px", color: "#fff" }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={stop}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "4px", flexShrink: 0 }}
        >
          <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
