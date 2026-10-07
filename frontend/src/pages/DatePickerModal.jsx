import { useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d)) return null;
  return d;
}

function formatDate(year, month, day) {
  // e.g. "August 22, 2026"
  return `${MONTHS[month]} ${day}, ${year}`;
}

export default function DatePicker({ value, onSelect, onClose }) {
  const today = new Date();
  const initial = parseDate(value) || today;

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState(
    value
      ? { year: initial.getFullYear(), month: initial.getMonth(), day: initial.getDate() }
      : null
  );

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (day) =>
    selected &&
    selected.year === viewYear &&
    selected.month === viewMonth &&
    selected.day === day;

  const isToday = (day) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const handleDay = (day) => {
    setSelected({ year: viewYear, month: viewMonth, day });
    onSelect(formatDate(viewYear, viewMonth, day));
  };

  // Build grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
      />

      {/* Calendar card */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: "#1a1a1a",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 36px",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={prevMonth}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", color: "#E0C898" }}
          >
            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span style={{ color: "#FFFFFF", fontWeight: "700", fontSize: "18px" }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", color: "#E0C898" }}
          >
            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "8px" }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: "12px", color: "#9B6E00", fontWeight: "600", paddingBottom: "4px" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const sel = isSelected(day);
            const tod = isToday(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDay(day)}
                style={{
                  height: "40px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: sel ? "700" : tod ? "600" : "400",
                  backgroundColor: sel ? "#EA580C" : tod ? "rgba(234,88,12,0.15)" : "transparent",
                  color: sel ? "#FFFFFF" : tod ? "#EA580C" : "#E0C898",
                  transition: "all 0.1s",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Close pill */}
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#2a2a2a",
            color: "#9B6E00",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
}
