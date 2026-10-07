import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { getEvents } from "../lib/api";

// ─── Calendar helpers (same as Calendar.jsx) ─────────────────────────────────
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function buildCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result = [];
  for (let i = 0; i < firstDay; i++) result.push(null);
  for (let d = 1; d <= daysInMonth; d++) result.push(d);
  while (result.length % 7 !== 0) result.push(null);
  return result;
}

// ─── Featured carousel ────────────────────────────────────────────────────────
function FeaturedCarousel({ events }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [slide, setSlide] = useState(0);
  const isPaused = useRef(false);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setSlide(Math.round(el.scrollLeft / el.offsetWidth));
  }

  useEffect(() => {
    if (events.length <= 1) return;
    const id = setInterval(() => {
      if (isPaused.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const current = Math.round(el.scrollLeft / el.offsetWidth);
      const next = current >= events.length - 1 ? 0 : current + 1;
      el.scrollTo({ left: next * el.offsetWidth, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(id);
  }, [events.length]);

  if (!events.length) {
    return (
      <div style={{ background: "var(--bg-card)", borderRadius: "20px", padding: "32px 16px", textAlign: "center" }}>
        <p style={{ color: "var(--t5)", fontSize: "14px" }}>No featured events yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Rounded clip wrapper */}
      <div style={{ borderRadius: "20px", overflow: "hidden" }}>
        {/* Scrollable strip */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onTouchStart={() => { isPaused.current = true; }}
          onTouchEnd={() => { setTimeout(() => { isPaused.current = false; }, 2000); }}
          onMouseEnter={() => { isPaused.current = true; }}
          onMouseLeave={() => { isPaused.current = false; }}
          style={{
            display: "flex",
            overflowX: "scroll",
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {events.map((ev) => {
            const thumb = ev.thumbnail_url
              || (ev.video_id ? `https://img.youtube.com/vi/${ev.video_id}/maxresdefault.jpg` : null);
            const vaktas = [ev.vakta, ev.vakta2].filter(Boolean).map((v) => v.name).join(" & ");

            return (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                style={{
                  flexShrink: 0,
                  width: "100%",
                  scrollSnapAlign: "center",
                  position: "relative",
                  height: "220px",
                  cursor: "pointer",
                  background: thumb ? "transparent" : "var(--bg-el)",
                  overflow: "hidden",
                }}
              >
                {thumb && (
                  <img
                    src={thumb}
                    alt={ev.topic}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                  />
                )}
                {/* Dark gradient overlay — always dark so text is always readable over image */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)",
                }} />
                {/* Text */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px" }}>
                  {ev.category && (
                    <span style={{ fontSize: "10px", color: "#EA580C", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>
                      {ev.category}
                    </span>
                  )}
                  <p style={{ fontSize: "18px", fontWeight: "700", color: "#F9FAFB", margin: "2px 0 4px", lineHeight: 1.2 }}>
                    {ev.topic || ev.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "12px", color: "#D1D5DB", margin: 0 }}>
                      {[vaktas, ev.event_date].filter(Boolean).join(" · ")}
                    </p>
                    <svg style={{ width: 18, height: 18, color: "#EA580C", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      {events.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "10px" }}>
          {events.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slide ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: i === slide ? "#EA580C" : "var(--bg-el2)",
                transition: "all 0.25s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Embedded mini calendar (admin only) ──────────────────────────────────────
function EmbeddedCalendar({ events }) {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const eventMap = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const d = parseDate(ev.event_date);
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = ev;
    });
    return map;
  }, [events]);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const thisMonthEvents = useMemo(() =>
    events.filter((ev) => {
      const d = parseDate(ev.event_date);
      return d && d.getFullYear() === year && d.getMonth() === month;
    }), [events, year, month]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function isToday(day) {
    return day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  }

  const gridStyle = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" };

  return (
    <div>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "var(--bg-el)", color: "var(--t3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "var(--bg-el)", color: "var(--t3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div style={gridStyle} className="mb-1">
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", color: "var(--t4)", fontWeight: "500", paddingBottom: "4px" }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ ...gridStyle, gap: "2px", backgroundColor: "var(--bg-page)", borderRadius: "16px", overflow: "hidden", padding: "4px" }}>
        {cells.map((day, idx) => {
          const key = day ? `${year}-${month}-${day}` : null;
          const ev = key ? (eventMap[key] || null) : null;
          const todayCell = isToday(day);
          if (!day) return <div key={idx} style={{ aspectRatio: "1" }} />;
          return (
            <div
              key={idx}
              onClick={() => ev && navigate(`/events/${ev.id}`)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "flex-start", paddingTop: "4px", paddingBottom: "4px",
                borderRadius: "8px", cursor: ev ? "pointer" : "default",
                backgroundColor: ev ? "var(--bg-el)" : "transparent", minHeight: "60px", overflow: "hidden",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: todayCell ? "700" : "400",
                backgroundColor: todayCell ? "#EA580C" : "transparent",
                color: todayCell ? "#fff" : ev ? "var(--t1)" : "var(--t3)",
                flexShrink: 0,
              }}>{day}</div>
              {ev && ev.thumbnail_url ? (
                <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", marginTop: "3px", border: "2px solid #EA580C", flexShrink: 0 }}>
                  <img src={ev.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} loading="lazy"
                    onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                </div>
              ) : ev ? (
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#EA580C", marginTop: "6px" }} />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* This month events list */}
      {thisMonthEvents.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "11px", color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            {MONTHS[month]} · {thisMonthEvents.length} {thisMonthEvents.length === 1 ? "event" : "events"}
          </p>
          <div style={{ background: "var(--bg-card)", borderRadius: "14px", overflow: "hidden" }}>
            {thisMonthEvents.map((ev, i) => {
              const d = parseDate(ev.event_date);
              return (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px", background: "transparent", border: "none",
                    borderBottom: i < thisMonthEvents.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  {ev.thumbnail_url ? (
                    <img src={ev.thumbnail_url} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", objectPosition: "center top", flexShrink: 0, border: "2px solid #EA580C" }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--bg-el)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "var(--t4)" }}>
                      {d ? d.getDate() : "?"}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", color: "var(--t1)", fontWeight: "600", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.topic || ev.title}</p>
                    <p style={{ fontSize: "11px", color: "var(--t4)", margin: 0 }}>
                      {d ? `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}` : ev.event_date}
                    </p>
                  </div>
                  <svg style={{ width: 14, height: 14, color: "var(--t5)", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {thisMonthEvents.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--t4)", fontSize: "13px", marginTop: "16px" }}>No sabhas this month</p>
      )}
    </div>
  );
}

// ─── Main Home page ───────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getEvents()
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setAllEvents(all);
        setFeatured(all.filter((e) => e.featured));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // ── Logged out — intentionally dark branded landing screen ──────────────────
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0F0A00", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", paddingBottom: "80px" }}>
        <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: "3px solid #EA580C" }}>
            <img src="/swami.jpg" alt="HPYS" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: "13px", fontWeight: "800", letterSpacing: "0.15em", color: "#FBBF24", margin: "0 0 4px" }}>
              HPYS · SCARBOROUGH
            </p>
            <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "32px", color: "#FCD34D", margin: 0, lineHeight: 1 }}>
              Event Manager
            </p>
          </div>
          <p style={{ fontSize: "15px", color: "#9CA3AF", textAlign: "center", maxWidth: "260px", lineHeight: 1.5, margin: "4px 0 0" }}>
            Jai Swaminarayan — track sabhas, speakers & audio recordings
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={() => navigate("/login")}
            style={{ width: "100%", padding: "15px", borderRadius: "16px", border: "none", backgroundColor: "#EA580C", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            style={{ width: "100%", padding: "15px", borderRadius: "16px", border: "1.5px solid #374151", backgroundColor: "transparent", color: "#E5E7EB", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #EA580C", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Logged in ───────────────────────────────────────────────────────────────
  const firstName = user.name?.split(" ")[0] || user.username;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)", paddingTop: "56px", paddingBottom: "90px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Greeting */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", color: "var(--t4)", margin: "0 0 2px", fontWeight: "500" }}>Jai Swaminarayan 🙏</p>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "var(--t1)", margin: 0 }}>{firstName}</h1>
        </div>

        {/* Featured events */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)", margin: 0 }}>Featured</h2>
            <button
              onClick={() => navigate("/events")}
              style={{ fontSize: "13px", color: "#EA580C", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
            >
              All events →
            </button>
          </div>
          <FeaturedCarousel events={featured} />
        </div>

        {/* Admin: calendar section */}
        {user.role === "admin" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)", margin: 0 }}>Calendar</h2>
              <button
                onClick={() => navigate("/calendar")}
                style={{ fontSize: "13px", color: "#EA580C", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
              >
                Full view →
              </button>
            </div>
            <EmbeddedCalendar events={allEvents} />
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
