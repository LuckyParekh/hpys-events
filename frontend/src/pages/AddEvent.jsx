import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent, getVakta, getTopics } from "../lib/api";
import DatePicker from "./DatePickerModal";

const EVENT_TYPES = [
  { value: "sabha", label: "Sabha", emoji: "🕉️" },
  { value: "gathering", label: "Gathering", emoji: "🤝" },
  { value: "outing", label: "Outing", emoji: "🌿" },
  { value: "event", label: "Event", emoji: "📅" },
];

const DEFAULT_ADDRESS = "1960 Ellesmere Rd Unit 9, Scarborough, ON M1H 2V9";

export default function AddEvent() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [vaktas, setVaktas] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicMode, setTopicMode] = useState("select"); // "select" | "manual"
  const [thumbMode, setThumbMode] = useState("url"); // "url" | "upload"
  const thumbFileRef = useRef(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [audioMode, setAudioMode] = useState("url"); // "url" | "upload"
  const [audioFile, setAudioFile] = useState(null);
  const audioFileRef = useRef(null);

  const [form, setForm] = useState({
    event_type: "sabha",
    topic: "",
    title: "",
    event_date: "",
    address: DEFAULT_ADDRESS,
    thumbnail_url: "",
    youtube_url: "",
    audio_url: "",
    description: "",
    vakta_id: "",
    vakta_id_2: "",
    sabha_style: "",
    status: "upcoming",
    featured: false,
  });

  useEffect(() => {
    getVakta().then(setVaktas).catch(() => {});
    getTopics().then(setTopics).catch(() => {});
  }, []);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const isSabha = form.event_type === "sabha";
  const eventTypeLabel = EVENT_TYPES.find(t => t.value === form.event_type)?.label || "Event";

  const handleThumbFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const switchToManualTopic = () => {
    setTopicMode("manual");
    setForm((f) => ({ ...f, topic: "" }));
  };

  const switchToSelectTopic = () => {
    setTopicMode("select");
    setForm((f) => ({ ...f, topic: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

      let thumbnail_url = form.thumbnail_url;
      if (thumbMode === "upload" && thumbFile) {
        const fd = new FormData();
        fd.append("file", thumbFile);
        const res = await fetch(`${BASE}/api/media/upload`, { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          thumbnail_url = data.url;
        }
      }

      let audio_url = form.audio_url;
      if (audioMode === "upload" && audioFile) {
        const fd = new FormData();
        fd.append("file", audioFile);
        const res = await fetch(`${BASE}/api/media/upload-audio`, { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          audio_url = data.url;
        }
      }

      const payload = {
        event_type: form.event_type,
        title: isSabha ? (form.topic || "Sabha") : form.title,
        topic: isSabha ? form.topic : null,
        event_date: form.event_date || null,
        address: form.address || null,
        thumbnail_url: thumbnail_url || null,
        youtube_url: form.youtube_url || null,
        audio_url: audio_url || null,
        description: form.description || null,
        sabha_style: isSabha && form.sabha_style ? form.sabha_style : null,
        vakta_id: isSabha && form.vakta_id ? parseInt(form.vakta_id) : null,
        vakta_id_2: isSabha && form.vakta_id_2 ? parseInt(form.vakta_id_2) : null,
        status: form.status,
        featured: form.featured,
        category: isSabha ? "Scarborough Sabha" : eventTypeLabel,
      };

      const created = await createEvent(payload);
      navigate(`/events/${created.id}`);
    } catch (err) {
      alert("Failed to save event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayThumb = thumbMode === "upload" ? thumbPreview : (form.thumbnail_url || null);

  return (
    <div className="pb-28 pt-20 px-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Add Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Event Type */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <label className="label mb-3">Event Type</label>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, event_type: t.value }))}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: form.event_type === t.value ? "2px solid #EA580C" : "2px solid #E0C898",
                  backgroundColor: form.event_type === t.value ? "rgba(234,88,12,0.12)" : "transparent",
                  color: form.event_type === t.value ? "#EA580C" : "#7A5500",
                  fontWeight: form.event_type === t.value ? "600" : "400",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "18px" }}>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sabha fields */}
        {isSabha && (
          <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Sabha Details</h2>

            {/* Sabha Style */}
            <div>
              <label className="label">Sabha Style</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "video", label: "Video", emoji: "🎥" },
                  { value: "vakta", label: "Vakta", emoji: "🎤" },
                  { value: "presentation", label: "Presentation", emoji: "📊" },
                  { value: "podcast", label: "Podcast", emoji: "🎙️" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sabha_style: f.sabha_style === s.value ? "" : s.value }))}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: form.sabha_style === s.value ? "2px solid #EA580C" : "2px solid #E0C898",
                      backgroundColor: form.sabha_style === s.value ? "rgba(234,88,12,0.12)" : "transparent",
                      color: form.sabha_style === s.value ? "#EA580C" : "#7A5500",
                      fontWeight: form.sabha_style === s.value ? "600" : "400",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic — dropdown + manual toggle */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label className="label" style={{ marginBottom: 0 }}>
                  Topic <span style={{ color: "#EA580C" }}>*</span>
                </label>
                {topicMode === "select" ? (
                  <button
                    type="button"
                    onClick={switchToManualTopic}
                    title="Add a new topic"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "#EA580C",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 0",
                    }}
                  >
                    <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New topic
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={switchToSelectTopic}
                    style={{
                      fontSize: "12px",
                      color: "#7A5500",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 0",
                    }}
                  >
                    ← Pick existing
                  </button>
                )}
              </div>

              {topicMode === "select" ? (
                <select
                  className="input"
                  value={form.topic}
                  onChange={set("topic")}
                  required
                >
                  <option value="">— Select a topic —</option>
                  {topics.map((t) => (
                    <option key={t.topic} value={t.topic}>{t.topic}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  value={form.topic}
                  onChange={set("topic")}
                  placeholder="Type the topic…"
                  required
                  autoFocus
                />
              )}
            </div>

            <div>
              <label className="label">Speaker 1</label>
              <select className="input" value={form.vakta_id} onChange={set("vakta_id")}>
                <option value="">— Select speaker —</option>
                {vaktas.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Speaker 2 <span style={{ color: "#9B6E00", fontSize: "12px" }}>(optional)</span></label>
              <select className="input" value={form.vakta_id_2} onChange={set("vakta_id_2")}>
                <option value="">— Select second speaker —</option>
                {vaktas.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">YouTube URL <span style={{ color: "#9B6E00", fontSize: "12px" }}>(optional)</span></label>
              <input
                className="input"
                value={form.youtube_url}
                onChange={set("youtube_url")}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>
        )}

        {/* Non-Sabha: title */}
        {!isSabha && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <label className="label">Title <span style={{ color: "#EA580C" }}>*</span></label>
            <input
              className="input"
              value={form.title}
              onChange={set("title")}
              placeholder={`Name of this ${eventTypeLabel.toLowerCase()}`}
              required
            />
          </div>
        )}

        {/* Common fields */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Event Info</h2>

          <div>
            <label className="label">Date</label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #E0C898",
                backgroundColor: "#FEF3E2",
                color: form.event_date ? "#7A5500" : "#B8900A",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg style={{ width: "16px", height: "16px", flexShrink: 0, color: "#EA580C" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {form.event_date || "Select a date…"}
            </button>
            {showDatePicker && (
              <DatePicker
                value={form.event_date}
                onSelect={(dateStr) => {
                  setForm((f) => ({ ...f, event_date: dateStr }));
                  setShowDatePicker(false);
                }}
                onClose={() => setShowDatePicker(false)}
              />
            )}
          </div>

          <div>
            <label className="label">Address / Location</label>
            <input
              className="input"
              value={form.address}
              onChange={set("address")}
              placeholder="e.g. 123 Sheppard Ave E, Scarborough"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="label">Thumbnail</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              {["url", "upload"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setThumbMode(mode)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "20px",
                    border: thumbMode === mode ? "2px solid #EA580C" : "2px solid #E0C898",
                    backgroundColor: thumbMode === mode ? "rgba(234,88,12,0.1)" : "transparent",
                    color: thumbMode === mode ? "#EA580C" : "#7A5500",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {mode === "url" ? "Paste URL" : "Upload File"}
                </button>
              ))}
            </div>

            {thumbMode === "url" ? (
              <input
                className="input"
                value={form.thumbnail_url}
                onChange={set("thumbnail_url")}
                placeholder="https://example.com/image.jpg"
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={thumbFileRef}
                  onChange={handleThumbFile}
                  style={{ display: "none" }}
                  id="thumb-upload"
                />
                <label
                  htmlFor="thumb-upload"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px dashed #E0C898",
                    backgroundColor: "#FEF3E2",
                    cursor: "pointer",
                    color: "#7A5500",
                    fontSize: "14px",
                  }}
                >
                  <svg style={{ width: "18px", height: "18px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {thumbFile ? thumbFile.name : "Choose image…"}
                </label>
              </div>
            )}

            {displayThumb && (
              <div style={{ marginTop: "10px", borderRadius: "10px", overflow: "hidden", maxHeight: "160px" }}>
                <img
                  src={displayThumb}
                  alt="preview"
                  style={{ width: "100%", objectFit: "cover", maxHeight: "160px" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="label">Description <span style={{ color: "#9B6E00", fontSize: "12px" }}>(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="A short note about this event…"
            />
          </div>

          {/* Audio */}
          <div>
            <label className="label">
              Audio Recording <span style={{ color: "#9B6E00", fontSize: "12px" }}>(optional)</span>
            </label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              {["url", "upload"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAudioMode(mode)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "20px",
                    border: audioMode === mode ? "2px solid #EA580C" : "2px solid #E0C898",
                    backgroundColor: audioMode === mode ? "rgba(234,88,12,0.1)" : "transparent",
                    color: audioMode === mode ? "#EA580C" : "#7A5500",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {mode === "url" ? "Paste URL" : "Upload File"}
                </button>
              ))}
            </div>

            {audioMode === "url" ? (
              <input
                className="input"
                value={form.audio_url}
                onChange={set("audio_url")}
                placeholder="https://example.com/audio.mp3"
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="audio/*"
                  ref={audioFileRef}
                  onChange={(e) => setAudioFile(e.target.files[0] || null)}
                  style={{ display: "none" }}
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px dashed #E0C898",
                    backgroundColor: "#FEF3E2",
                    cursor: "pointer",
                    color: "#7A5500",
                    fontSize: "14px",
                  }}
                >
                  <svg style={{ width: "18px", height: "18px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  {audioFile ? audioFile.name : "Choose audio file…"}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Status + Featured */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
          <div>
            <label className="label mb-2">Status</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["upcoming", "past"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  style={{
                    padding: "6px 18px",
                    borderRadius: "20px",
                    border: form.status === s ? "2px solid #EA580C" : "2px solid #E0C898",
                    backgroundColor: form.status === s ? "rgba(234,88,12,0.1)" : "transparent",
                    color: form.status === s ? "#EA580C" : "#7A5500",
                    fontSize: "13px",
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label className="label" style={{ marginBottom: 0 }}>Featured Event</label>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, featured: !f.featured }))}
              style={{
                position: "relative",
                display: "inline-flex",
                height: "24px",
                width: "44px",
                alignItems: "center",
                borderRadius: "12px",
                backgroundColor: form.featured ? "#EA580C" : "#E0C898",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  height: "16px",
                  width: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#FDF8F0",
                  transform: form.featured ? "translateX(24px)" : "translateX(4px)",
                  transition: "transform 0.15s",
                }}
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Event"}
        </button>
      </form>
    </div>
  );
}
