import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVaktaById, updateVakta, mediaUrl } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import EventCard from "../components/EventCard";

export default function VaktaProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [vakta, setVakta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhoto, setEditPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVaktaById(id).then(setVakta).finally(() => setLoading(false));
  }, [id]);

  function openEdit() {
    setEditName(vakta.name || "");
    setEditBio(vakta.bio || "");
    setEditPhoto(null);
    setPhotoPreview(null);
    setShowEdit(true);
  }

  function onPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setEditPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("bio", editBio);
      if (editPhoto) fd.append("photo", editPhoto);
      const updated = await updateVakta(id, fd);
      setVakta((prev) => ({ ...prev, ...updated }));
      setShowEdit(false);
    } catch {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vakta) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-gray-400">Speaker not found</p>
        <button className="btn-secondary" onClick={() => navigate("/vakta")}>Go back</button>
      </div>
    );
  }

  const currentPhoto = photoPreview || (vakta.photo_url ? mediaUrl(vakta.photo_url) : null);

  return (
    <div className="pb-28 pt-14">
      {/* Back button */}
      <button
        className="fixed top-16 left-4 z-10 bg-gray-900/80 backdrop-blur rounded-full p-2"
        onClick={() => navigate(-1)}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Edit button — admin only */}
      {isAdmin && (
        <button
          className="fixed top-16 right-4 z-10 bg-gray-900/80 backdrop-blur rounded-full p-2"
          onClick={openEdit}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* Hero */}
      <div className="relative h-52 bg-gray-800 overflow-hidden">
        {vakta.photo_url ? (
          <img
            src={mediaUrl(vakta.photo_url)}
            alt={vakta.name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-blue-800 flex items-center justify-center text-4xl font-bold text-white">
              {vakta.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
      </div>

      <div className="px-4">
        <h1 className="text-2xl font-bold text-white mt-3">{vakta.name}</h1>
        {vakta.bio && <p className="text-gray-400 text-sm mt-1">{vakta.bio}</p>}

        <div className="mt-2 mb-5">
          <span className="text-xs text-gray-500">{vakta.events?.length || 0} events</span>
        </div>

        {vakta.events && vakta.events.length > 0 ? (
          <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
            {vakta.events.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-10">No events yet for this speaker.</p>
        )}
      </div>

      {/* Edit Bottom Sheet */}
      {showEdit && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end"
          onClick={() => setShowEdit(false)}
        >
          <div
            className="bg-gray-900 rounded-t-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Edit Speaker</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">

              {/* Photo picker */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center">
                    {currentPhoto ? (
                      <img src={currentPhoto} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-white text-2xl font-bold">
                        {editName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <label
                    htmlFor="edit-photo"
                    className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                  <input
                    id="edit-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPhotoChange}
                  />
                </div>
                <span className="text-xs text-gray-500">Tap camera to change photo</span>
              </div>

              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Speaker name"
                  required
                />
              </div>

              <div>
                <label className="label">Bio</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Short bio about this speaker…"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
