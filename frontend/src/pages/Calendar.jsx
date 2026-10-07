import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "../lib/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function parseEventDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
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

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const eventMap = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const d = parseEventDate(ev.event_date);
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = ev;
    });
    return map;
  }, [events]);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const thisMonthEvents = useMemo(() =>
    events.filter((ev) => {
      const d = parseEventDate(ev.event_date);
      return d && d.getFullYear() === year && d.getMonth() === month;
    }),
    [events, year, month]
  );

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function isToday(day) {
    return day &&
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate();
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
  };

  return (
    <div className="pb-28 pt-16 px-3">

      {/* Month navigation */}
      <div className="flex items-center justify-between mt-4 mb-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-white">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={gridStyle} className="mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            style={{ textAlign: "center" }}
            className="text-xs text-gray-500 font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{ ...gridStyle, gap: "2px" }}
        className="bg-gray-950 rounded-2xl overflow-hidden p-1"
      >
        {cells.map((day, idx) => {
          const key = day ? `${year}-${month}-${day}` : null;
          const ev = key ? (eventMap[key] || null) : null;
          const todayCell = isToday(day);

          if (!day) {
            return <div key={idx} style={{ aspectRatio: "1" }} />;
          }

          return (
            <div
              key={idx}
              onClick={() => { if (ev) navigate(`/events/${ev.id}`); }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingTop: "4px",
                paddingBottom: "4px",
                borderRadius: "8px",
                cursor: ev ? "pointer" : "default",
                backgroundColor: ev ? "#F0DFC0" : "transparent",
                minHeight: "64px",
                overflow: "hidden",
              }}
            >
              {/* Date number */}
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: todayCell ? "700" : "400",
                  backgroundColor: todayCell ? "#EA580C" : "transparent",
                  color: todayCell ? "#FDF8F0" : ev ? "#2C1A00" : "#9B6E00",
                  flexShrink: 0,
                }}
              >
                {day}
              </div>

              {/* Thumbnail */}
              {ev && ev.thumbnail_url ? (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    marginTop: "4px",
                    border: "2px solid #EA580C",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={ev.thumbnail_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center top",
                    }}
                    loading="lazy"
                    onError={(e) => { e.target.parentElement.style.display = "none"; }}
                  />
                </div>
              ) : ev ? (
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                    marginTop: "6px",
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">1</div>
          <span className="text-xs text-gray-500">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full border-2 border-blue-500 overflow-hidden bg-slate-700" />
          <span className="text-xs text-gray-500">Sabha — tap to open</span>
        </div>
      </div>

      {/* This month's events list */}
      {thisMonthEvents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 px-1">
            {MONTHS[month]} · {thisMonthEvents.length} {thisMonthEvents.length === 1 ? "event" : "events"}
          </h3>
          <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
            {thisMonthEvents.map((ev) => {
              const d = parseEventDate(ev.event_date);
              return (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
                >
                  {ev.thumbnail_url ? (
                    <img
                      src={ev.thumbnail_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-blue-500"
                      style={{ objectPosition: "center top" }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center text-blue-300 text-xs font-bold">
                      {d ? d.getDate() : "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{ev.topic || ev.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {d ? `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}` : ev.event_date}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {thisMonthEvents.length === 0 && (
        <p className="text-center text-gray-600 text-sm mt-8">No sabhas this month</p>
      )}
    </div>
  );
}
