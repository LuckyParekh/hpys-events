import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { mediaUrl } from "../lib/api";
import { useState, useRef, useEffect } from "react";

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const MicIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);
const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 8V5a2 2 0 012-2z" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const allLinks = [
  { to: "/", label: "Home", icon: <HomeIcon /> },
  { to: "/events", label: "Events", icon: <GridIcon /> },
  { to: "/calendar", label: "Calendar", icon: <CalendarIcon /> },
  { to: "/vakta", label: "Vakta", icon: <MicIcon /> },
  { to: "/topics", label: "Topics", icon: <TagIcon /> },
  { to: "/add-event", label: "Add", icon: <PlusIcon />, adminOnly: true },
];

// Returns initials from a full name, e.g. "Lucky Parekh" → "LP"
function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isAdmin = user?.role === "admin";
  const links = allLinks.filter((l) => !l.adminOnly || isAdmin);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/");
  }

  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-orange-400 flex-shrink-0">
            <img
              src="/swami.jpg"
              alt="HPYS"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: "13px", fontWeight: "800", letterSpacing: "0.12em", color: "#FBBF24" }}>
              HPYS
            </span>
            <br />
            <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: "19px", color: "#FCD34D" }}>
              Event Manager
            </span>
          </div>
        </div>

        {/* Auth area */}
        {user ? (
          <div className="relative" ref={menuRef}>
            {/* Avatar button */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: "#EA580C",
                border: "2px solid #EA580C",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "0.05em",
                flexShrink: 0,
                padding: 0,
                overflow: "hidden",
              }}
            >
              {user.avatar_url ? (
                <img
                  src={mediaUrl(user.avatar_url)}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", borderRadius: "50%" }}
                />
              ) : (
                initials(user.name)
              )}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "180px",
                  backgroundColor: "#111827",
                  border: "1px solid #1F2937",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  zIndex: 100,
                }}
              >
                {/* User info header */}
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #1F2937" }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#F3F4F6", margin: 0 }}>
                    {user.name}
                  </p>
                  <p style={{ fontSize: "11px", color: "#6B7280", margin: "2px 0 0" }}>
                    @{user.username} · {user.role === "admin" ? "Admin" : "Viewer"}
                  </p>
                </div>

                {/* Menu items */}
                <button
                  onClick={() => { setMenuOpen(false); navigate("/account"); }}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    textAlign: "left",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid #1F2937",
                    color: "#E5E7EB",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <svg style={{ width: "15px", height: "15px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account
                </button>

                <button
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    textAlign: "left",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid #1F2937",
                    color: "#E5E7EB",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <svg style={{ width: "15px", height: "15px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    textAlign: "left",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#F87171",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <svg style={{ width: "15px", height: "15px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "5px 12px",
              borderRadius: "8px",
              border: "1px solid #EA580C",
              backgroundColor: "transparent",
              color: "#EA580C",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        )}
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex justify-around">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `nav-link${isActive ? " active" : ""}`
            }
          >
            {l.icon}
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
