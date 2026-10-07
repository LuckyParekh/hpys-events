import { useNavigate } from "react-router-dom";

export default function EventCard({ event }) {
  const navigate = useNavigate();

  const thumb = event.thumbnail_url || `https://img.youtube.com/vi/${event.video_id}/mqdefault.jpg`;

  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {/* Thumbnail */}
      <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
        {event.video_id || event.thumbnail_url ? (
          <img
            src={thumb}
            alt={event.topic || event.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {event.event_date && (
          <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-0.5">
            {event.event_date}
          </p>
        )}
        <p className="text-white font-medium text-sm truncate">
          {event.topic || event.title}
        </p>
        {(event.vakta || event.vakta2) && (
          <p className="text-gray-400 text-xs truncate">
            {[event.vakta?.name, event.vakta2?.name].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        {event.audio_url ? (
          <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">Audio</span>
        ) : event.status === "upcoming" ? (
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">Live</span>
        ) : null}
      </div>
    </div>
  );
}
