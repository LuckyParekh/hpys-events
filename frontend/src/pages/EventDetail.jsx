import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEvent, downloadAudio, getEvents, updateEvent, mediaUrl } from "../lib/api";
import EventCard from "../components/EventCard";
import { useAudio } from "../lib/AudioContext";
import { useAuth } from "../lib/AuthContext";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState("");
  const { play, togglePlay, playing, track } = useAudio();

  useEffect(() => {
    setLoading(true);
    getEvent(id)
      .then((e) => {
        setEvent(e);
        return getEvents({ status: e.status });
      })
      .then((all) => setSimilar(all.filter((x) => x.id !== parseInt(id)).slice(0, 4)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadAudio = async () => {
    setDownloading(true);
    setMsg("");
    try {
      const res = await downloadAudio(id);
      setMsg(res.message);
      // Mark as past
      await updateEvent(id, { status: "past" });
      setEvent((e) => ({ ...e, status: "past" }));
    } catch {
      setMsg("Failed to start audio download.");
    } finally {
      setDownloading(false);
    }
  };

  const refresh = () => {
    getEvent(id).then(setEvent);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-gray-400">Event not found</p>
        <button className="btn-secondary" onClick={() => navigate("/")}>Go back</button>
      </div>
    );
  }

  const thumb =
    event.thumbnail_url ||
    (event.video_id
      ? `https://img.youtube.com/vi/${event.video_id}/maxresdefault.jpg`
      : null);

  const audioSrc = event.audio_url ? mediaUrl(event.audio_url) : null;
  const isThisTrackPlaying = track?.eventId === parseInt(id) && playing;
  const isThisTrackLoaded = track?.eventId === parseInt(id);

  return (
    <div className="pb-28 pt-14">
      {/* Back button */}
      <button
        className="absolute top-16 left-4 z-10 bg-black/50 rounded-full p-2"
        onClick={() => navigate(-1)}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Hero image */}
      {thumb && (
        <div className="relative">
          <img src={thumb} alt={event.topic} className="w-full h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
        </div>
      )}

      <div className="px-4 -mt-4 relative">
        {/* Title section */}
        <div className="mb-5">
          <span className="text-xs text-blue-400 uppercase tracking-wide font-medium">
            {event.category}
          </span>
          <h1 className="text-2xl font-bold text-white mt-1 leading-tight">
            {event.topic || event.title}
          </h1>
          {(event.vakta || event.vakta2) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {[event.vakta, event.vakta2].filter(Boolean).map((v) => (
                <button
                  key={v.id}
                  className="flex items-center gap-2"
                  onClick={() => navigate(`/vakta/${v.id}`)}
                >
                  {v.photo_url && (
                    <img
                      src={mediaUrl(v.photo_url)}
                      alt={v.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  )}
                  <span className="text-gray-300 text-sm">{v.name}</span>
                </button>
              ))}
            </div>
          )}
          {event.event_date && (
            <p className="text-gray-500 text-sm mt-1">{event.event_date}</p>
          )}
          {event.address && (
            <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
              <svg style={{ width: "13px", height: "13px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.address}
            </p>
          )}
        </div>

        {/* Edit button — admin only */}
        {user?.role === "admin" && (
          <button
            className="btn-secondary w-full mb-4 flex items-center justify-center gap-2"
            onClick={() => navigate(`/events/${id}/edit`)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Event
          </button>
        )}

        {/* Audio player */}
        {audioSrc ? (
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <p className="text-sm text-gray-400 mb-3 font-medium">Audio Recording</p>
            <button
              onClick={() => {
                if (isThisTrackLoaded) togglePlay();
                else play(audioSrc, event.topic || event.title, parseInt(id));
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: isThisTrackPlaying ? "rgba(234,88,12,0.15)" : "#EA580C",
                color: isThisTrackPlaying ? "#EA580C" : "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s",
              }}
            >
              {isThisTrackPlaying ? (
                <>
                  <svg style={{ width: "18px", height: "18px" }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg style={{ width: "18px", height: "18px" }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {isThisTrackLoaded ? "Resume" : "Play Audio"}
                </>
              )}
            </button>
            {isThisTrackLoaded && (
              <p style={{ fontSize: "12px", color: "#9B6E00", textAlign: "center", marginTop: "8px" }}>
                Audio continues playing as you navigate
              </p>
            )}
          </div>
        ) : user?.role === "admin" ? (
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <p className="text-sm text-gray-400 mb-3">
              {event.status === "past"
                ? "Audio not yet downloaded."
                : "Event is upcoming. Download audio after the gathering ends."}
            </p>
            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={handleDownloadAudio}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Starting download…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Audio
                </>
              )}
            </button>
            {msg && (
              <p className="text-sm text-green-400 mt-2 text-center">{msg}</p>
            )}
            {event.audio_url && (
              <button className="text-xs text-blue-400 mt-2 w-full text-center" onClick={refresh}>
                ↻ Check if audio is ready
              </button>
            )}
          </div>
        ) : null}

        {/* Description / Summary */}
        {(event.description || event.summary) && (
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <p className="text-sm text-gray-400 font-medium mb-2">
              {event.summary ? "Summary" : "Description"}
            </p>
            <p className="text-gray-200 text-sm leading-relaxed">
              {event.summary || event.description}
            </p>
          </div>
        )}

        {/* YouTube embed */}
        {event.video_id && (
          <div className="rounded-2xl overflow-hidden mb-6">
            <div className="relative pb-[56.25%] bg-gray-900">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${event.video_id}`}
                title={event.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Similar Events */}
        {similar.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-lg mb-3">Similar Events</h2>
            <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
              {similar.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
