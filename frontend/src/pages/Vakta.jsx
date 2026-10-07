import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getVakta, createVakta, mediaUrl } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

function Avatar({ vakta }) {
  if (vakta.photo_url) {
    return (
      <img
        src={mediaUrl(vakta.photo_url)}
        alt={vakta.name}
        className="w-12 h-12 rounded-xl object-cover"
      />
    );
  }
  const initials = vakta.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-12 h-12 rounded-xl bg-blue-800 flex items-center justify-center text-white font-bold text-sm">
      {initials}
    </div>
  );
}

export default function Vakta() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [speakers, setSpeakers] = useState([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVakta().then(setSpeakers);
  }, []);

  const filtered = speakers.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (bio) fd.append("bio", bio);
      if (photo) fd.append("photo", photo);
      const created = await createVakta(fd);
      setSpeakers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAdd(false);
      setName("");
      setBio("");
      setPhoto(null);
    } catch {
      alert("Failed to add speaker.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-28 pt-16 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-4">
        <h1 className="text-2xl font-bold text-white">Vakta</h1>
        {isAdmin && (
          <button
            className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center"
            onClick={() => setShowAdd(true)}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <input
        className="input mb-4"
        placeholder="Search speakers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* List */}
      <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-10">No speakers yet. Tap + to add one.</p>
        )}
        {filtered.map((v) => (
          <button
            key={v.id}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors text-left"
            onClick={() => navigate(`/vakta/${v.id}`)}
          >
            <Avatar vakta={v} />
            <div className="flex-1">
              <p className="text-white font-medium">{v.name}</p>
              {v.bio && <p className="text-gray-400 text-xs truncate">{v.bio}</p>}
            </div>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Add Speaker Modal — admin only */}
      {isAdmin && showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={() => setShowAdd(false)}>
          <div
            className="bg-gray-900 rounded-t-3xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-lg mb-4">Add Speaker</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Speaker name" required />
              </div>
              <div>
                <label className="label">Bio (optional)</label>
                <input className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" />
              </div>
              <div>
                <label className="label">Photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-gray-300 text-sm"
                  onChange={(e) => setPhoto(e.target.files[0])}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? "Saving…" : "Add Speaker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
