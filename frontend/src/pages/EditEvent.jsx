import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEvent, updateEvent, deleteEvent, getVakta } from "../lib/api";
import DatePicker from "./DatePickerModal";

const CATEGORIES = ["Scarborough Sabha", "Activity", "Outing", "Gathering"];

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vaktas, setVaktas] = useState([]);
  const [form, setForm] = useState(null);

  useEffect(() => {
    Promise.all([getEvent(id), getVakta()]).then(([event, speakers]) => {
      setForm({
        title: event.title || "",
        topic: event.topic || "",
        event_date: event.event_date || "",
        category: event.category || "Scarborough Sabha",
        description: event.description || "",
        vakta_id: event.vakta_id ? String(event.vakta_id) : "",
        status: event.status || "upcoming",
        featured: event.featured || false,
        thumbnail_url: event.thumbnail_url || "",
        audio_url: event.audio_url || "",
        summary: event.summary || "",
      });
      setVaktas(speakers);
    }).finally(() => setLoading(false));
  }, [id]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateEvent(id, {
        ...form,
        vakta_id: form.vakta_id ? parseInt(form.vakta_id) : null,
      });
      navigate(`/events/${id}`);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteEvent(id);
      navigate("/");
    } catch {
      alert("Failed to delete.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28 pt-20 px-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          className="flex items-center gap-1 text-blue-400 text-sm"
          onClick={() => navigate(-1)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold text-white">Edit Event</h1>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-900 rounded-2xl p-4 space-y-4">

          <div>
            <label className="label">Topic <span className="text-blue-400">*</span></label>
            <input className="input" value={form.topic} onChange={set("topic")} placeholder="Event topic" required />
          </div>

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
            <label className="label">Vakta (Speaker)</label>
            <select className="input" value={form.vakta_id} onChange={set("vakta_id")}>
              <option value="">— Select speaker —</option>
              {vaktas.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.category === cat
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-600 text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <div className="flex gap-3">
              {["upcoming", "past"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors capitalize ${
                    form.status === s
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-600 text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="A short description of this gathering…"
            />
          </div>

          <div>
            <label className="label">Summary (post-event)</label>
            <textarea
              className="input resize-none"
              rows={4}
              value={form.summary}
              onChange={set("summary")}
              placeholder="Summary generated after the event…"
            />
          </div>

          <div>
            <label className="label">Audio URL (manual)</label>
            <input
              className="input"
              value={form.audio_url}
              onChange={set("audio_url")}
              placeholder="Leave blank — filled automatically on audio download"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="label mb-0">Featured Event</label>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, featured: !f.featured }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.featured ? "bg-blue-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.featured ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>

        <button
          type="button"
          className="w-full py-3 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors text-sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete Event"}
        </button>
      </form>
    </div>
  );
}
