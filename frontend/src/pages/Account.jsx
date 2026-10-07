import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { mediaUrl } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "";

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// ── Avatar — shows photo if set, otherwise initials ───────────────────────────
function Avatar({ name, size = 56, avatarUrl, onClick, uploading }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: size, height: size,
        borderRadius: "50%",
        flexShrink: 0,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {avatarUrl ? (
        <img
          src={mediaUrl(avatarUrl)}
          alt={name}
          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", objectPosition: "top", display: "block" }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          backgroundColor: "#EA580C",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.35, fontWeight: "700", color: "#fff",
          letterSpacing: "0.05em",
        }}>
          {uploading ? (
            <div style={{ width: size * 0.3, height: size * 0.3, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          ) : initials(name)}
        </div>
      )}

      {/* Uploading overlay on photo */}
      {avatarUrl && uploading && (
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: size * 0.3, height: size * 0.3, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Camera icon badge */}
      {onClick && !uploading && (
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: size * 0.36, height: size * 0.36,
          borderRadius: "50%",
          backgroundColor: "#EA580C",
          border: "2px solid var(--bg-card)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg style={{ width: size * 0.2, height: size * 0.2, color: "#fff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function Account() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [editMode, setEditMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role === "admin") fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoadingUsers(false);
    }
  }

  function startEdit() {
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setMsg("");
    setEditMode(true);
  }

  async function saveProfile() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to save");
      const updated = { ...user, ...data };
      localStorage.setItem("hpys_user", JSON.stringify(updated));
      window.location.reload();
    } catch (e) {
      setMsg(e.message);
      setSaving(false);
    }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be picked again later
    e.target.value = "";

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/auth/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      const updated = { ...user, avatar_url: data.avatar_url };
      localStorage.setItem("hpys_user", JSON.stringify(updated));
      window.location.reload();
    } catch (e) {
      alert(e.message);
      setAvatarUploading(false);
    }
  }

  async function removeAvatar() {
    if (!user.avatar_url) return;
    if (!confirm("Remove profile picture?")) return;
    try {
      await fetch(`${API_BASE}/api/auth/me/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = { ...user, avatar_url: null };
      localStorage.setItem("hpys_user", JSON.stringify(updated));
      window.location.reload();
    } catch {
      alert("Could not remove photo");
    }
  }

  async function toggleRole(u) {
    const newRole = u.role === "admin" ? "viewer" : "admin";
    try {
      const res = await fetch(`${API_BASE}/api/auth/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.detail || "Could not change role"); return; }
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x));
    } catch {
      alert("Network error");
    }
  }

  async function removeUser(u) {
    if (!confirm(`Remove ${u.name} (@${u.username})?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/users/${u.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers((prev) => prev.filter((x) => x.id !== u.id));
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Could not remove user");
      }
    } catch {
      alert("Network error");
    }
  }

  if (!user) return null;

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const admins = users.filter((u) => u.role === "admin");
  const viewers = users.filter((u) => u.role === "viewer");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)", paddingBottom: "96px", paddingTop: "56px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "24px 16px 0" }}>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--t4)", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)", margin: 0 }}>Account</h1>
          {!editMode ? (
            <button onClick={startEdit} style={{ color: "#EA580C", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
              Edit
            </button>
          ) : (
            <button onClick={() => setEditMode(false)} style={{ color: "var(--t4)", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>
              Cancel
            </button>
          )}
        </div>

        {/* ── Own profile card ── */}
        <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "18px", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "20px 16px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid var(--border)" }}>

            {/* Avatar — always tappable to change photo */}
            <Avatar
              name={editMode ? editName || user.name : user.name}
              size={54}
              avatarUrl={user.avatar_url}
              onClick={handleAvatarClick}
              uploading={avatarUploading}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              {editMode ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                  style={{ width: "100%", backgroundColor: "var(--bg-el)", border: "1px solid var(--bg-el2)", borderRadius: "8px", padding: "6px 10px", color: "var(--t1)", fontSize: "15px", fontWeight: "600", boxSizing: "border-box" }}
                />
              ) : (
                <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)", margin: "0 0 2px" }}>{user.name}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: editMode ? "6px" : 0 }}>
                <span style={{ fontSize: "12px", color: "var(--t4)" }}>@{user.username}</span>
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>

          {/* Email row */}
          <div style={{ padding: "12px 16px", borderBottom: editMode ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</span>
            {editMode ? (
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ backgroundColor: "var(--bg-el)", border: "1px solid var(--bg-el2)", borderRadius: "8px", padding: "5px 10px", color: "var(--t1)", fontSize: "13px", width: "55%", textAlign: "right" }}
              />
            ) : (
              <span style={{ fontSize: "13px", color: user.email ? "var(--t1)" : "var(--t5)" }}>
                {user.email || "Not set"}
              </span>
            )}
          </div>

          {/* Edit mode actions */}
          {editMode && (
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {msg && <p style={{ color: "#F87171", fontSize: "12px", textAlign: "center", margin: 0 }}>{msg}</p>}
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{ width: "100%", padding: "11px", borderRadius: "12px", border: "none", backgroundColor: "#EA580C", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {user.avatar_url && (
                <button
                  onClick={removeAvatar}
                  style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "#F87171", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}
                >
                  Remove Profile Photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tap to change hint */}
        {!editMode && (
          <p style={{ textAlign: "center", fontSize: "11px", color: "var(--t5)", marginTop: "-14px", marginBottom: "20px" }}>
            Tap photo to change
          </p>
        )}

        {joinedDate && !editMode && (
          <p style={{ textAlign: "center", fontSize: "11px", color: "var(--t4)", marginBottom: "24px" }}>
            Member since {joinedDate}
          </p>
        )}

        {/* ── Admin: user management ── */}
        {user.role === "admin" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                All Members
              </h2>
              <span style={{ fontSize: "12px", color: "var(--t5)" }}>{users.length} total</span>
            </div>

            {loadingUsers ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #EA580C", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : (
              <>
                {admins.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ fontSize: "10px", color: "var(--t5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px", paddingLeft: "4px" }}>Admins ({admins.length})</p>
                    <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
                      {admins.map((u, i) => (
                        <UserRow key={u.id} u={u} isMe={u.id === user.id} editMode={editMode} onToggleRole={toggleRole} onRemove={removeUser} last={i === admins.length - 1} />
                      ))}
                    </div>
                  </div>
                )}

                {viewers.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <p style={{ fontSize: "10px", color: "var(--t5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px", paddingLeft: "4px" }}>Members ({viewers.length})</p>
                    <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
                      {viewers.map((u, i) => (
                        <UserRow key={u.id} u={u} isMe={u.id === user.id} editMode={editMode} onToggleRole={toggleRole} onRemove={removeUser} last={i === viewers.length - 1} />
                      ))}
                    </div>
                  </div>
                )}

                {users.length === 0 && (
                  <p style={{ color: "var(--t5)", textAlign: "center", padding: "24px 0" }}>No users yet</p>
                )}
              </>
            )}
          </>
        )}

        {/* Logout */}
        {!editMode && (
          <button
            onClick={() => { logout(); navigate("/"); }}
            style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "#F87171", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function UserRow({ u, isMe, editMode, onToggleRole, onRemove, last }) {
  return (
    <div style={{ padding: "12px 14px", borderBottom: last ? "none" : "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
      {/* Mini avatar */}
      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden" }}>
        {u.avatar_url ? (
          <img src={`${import.meta.env.VITE_API_URL || ""}${u.avatar_url}`} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", backgroundColor: "#EA580C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#fff" }}>
            {u.name.split(" ").filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join("")}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{u.name}</span>
          {isMe && <span style={{ fontSize: "10px", color: "var(--t5)" }}>(you)</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
          <span style={{ fontSize: "11px", color: "var(--t4)" }}>@{u.username}</span>
          {u.email && <span style={{ fontSize: "11px", color: "var(--t5)" }}>· {u.email}</span>}
        </div>
      </div>

      {editMode && !isMe && (
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button
            onClick={() => onToggleRole(u)}
            title={u.role === "admin" ? "Make viewer" : "Make admin"}
            style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid var(--bg-el2)", backgroundColor: "transparent", color: u.role === "admin" ? "#EA580C" : "#818CF8", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
          >
            {u.role === "admin" ? "→ Viewer" : "→ Admin"}
          </button>
          <button
            onClick={() => onRemove(u)}
            title="Remove user"
            style={{ padding: "5px 8px", borderRadius: "8px", border: "1px solid var(--bg-el2)", backgroundColor: "transparent", color: "#F87171", fontSize: "12px", cursor: "pointer" }}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {!editMode && <RoleBadge role={u.role} />}
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", backgroundColor: isAdmin ? "rgba(234,88,12,0.15)" : "rgba(99,102,241,0.15)", color: isAdmin ? "#EA580C" : "#818CF8", flexShrink: 0 }}>
      {isAdmin ? "Admin" : "Viewer"}
    </span>
  );
}
