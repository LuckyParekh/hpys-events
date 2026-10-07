import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "../lib/api";
import EventCard from "../components/EventCard";

export default function Events() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  // Load upcoming + past when not searching
  useEffect(() => {
    if (search.trim()) return;
    setLoading(true);
    Promise.all([
      getEvents({ status: "upcoming" }),
      getEvents({ status: "past" }),
    ])
      .then(([u, p]) => { setUpcoming(u); setPast(p); })
      .finally(() => setLoading(false));
  }, [search]);

  // Debounced search across all events
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      getEvents({ search: search.trim() })
        .then(setResults)
        .finally(() => setLoading(false));
    }, 300);
  }, [search]);

  const featured = upcoming.find((e) => e.featured) || upcoming[0];

  return (
    <div className="pb-24 pt-16">
      {/* Featured banner — only show if there's an actual image */}
      {featured && (featured.thumbnail_url || featured.video_id) && (
        <div
          className="relative cursor-pointer mx-4 mt-4 rounded-2xl overflow-hidden"
          onClick={() => navigate(`/events/${featured.id}`)}
        >
          <img
            src={
              featured.thumbnail_url ||
              `https://img.youtube.com/vi/${featured.video_id}/maxresdefault.jpg`
            }
            alt={featured.topic}
            className="w-full h-52 object-cover"
            onError={(e) => { e.target.closest(".relative").style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-xs text-blue-300 font-medium uppercase tracking-wide">
              {featured.category} · {featured.event_date}
            </span>
            <h2 className="text-white font-bold text-lg leading-tight mt-1">
              {featured.topic || featured.title}
            </h2>
            {featured.vakta && (
              <p className="text-gray-300 text-sm">Vakta: {featured.vakta.name}</p>
            )}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="px-4 mt-4" style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <svg
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9B6E00", pointerEvents: "none" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            className="input"
            style={{ paddingLeft: "36px", paddingRight: search ? "36px" : "14px" }}
            placeholder="Search by topic, speaker, date, style…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9B6E00", fontSize: "18px", lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center mt-12">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* Search results */}
          {search.trim() ? (
            <section className="mt-6 px-4">
              <h2 className="text-white font-bold text-xl mb-1">
                Results
                <span style={{ fontSize: "13px", fontWeight: 400, color: "#9B6E00", marginLeft: "8px" }}>
                  {results.length} found
                </span>
              </h2>
              {results.length > 0 ? (
                <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800 mt-3">
                  {results.map((e) => <EventCard key={e.id} event={e} />)}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-16">
                  <p className="text-lg">No matches</p>
                  <p className="text-sm mt-1">Try a topic, speaker name, date, or style</p>
                </div>
              )}
            </section>
          ) : (
            <>
              {/* Upcoming */}
              {upcoming.length > 0 && (
                <section className="mt-6 px-4">
                  <h2 className="text-white font-bold text-xl mb-3">Upcoming Events</h2>
                  <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
                    {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                </section>
              )}

              {/* Past */}
              {past.length > 0 && (
                <section className="mt-6 px-4">
                  <h2 className="text-white font-bold text-xl mb-3">Past Events</h2>
                  <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
                    {past.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                </section>
              )}

              {upcoming.length === 0 && past.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                  <p className="text-lg">No events yet</p>
                  <p className="text-sm mt-1">Tap + Add Event to get started</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
