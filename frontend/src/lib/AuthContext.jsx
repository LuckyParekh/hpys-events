import { createContext, useContext, useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("hpys_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("hpys_token") || null;
    } catch {
      return null;
    }
  });

  // On mount, validate the stored token is still good
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("token invalid");
        return r.json();
      })
      .then((u) => {
        setUser(u);
        localStorage.setItem("hpys_user", JSON.stringify(u));
      })
      .catch(() => {
        // Token expired or invalid — clear session
        setToken(null);
        setUser(null);
        localStorage.removeItem("hpys_token");
        localStorage.removeItem("hpys_user");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(username, pin) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    try {
      localStorage.setItem("hpys_token", data.access_token);
      localStorage.setItem("hpys_user", JSON.stringify(data.user));
    } catch {
      // localStorage unavailable — session-only login is fine
    }
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("hpys_token");
      localStorage.removeItem("hpys_user");
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
