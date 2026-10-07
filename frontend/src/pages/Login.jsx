import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const MAX_PIN = 6;

  function pressDigit(d) {
    if (pin.length < MAX_PIN) setPin((p) => p + d);
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  async function submit() {
    if (pin.length !== MAX_PIN) {
      setError("Enter all 6 digits");
      return;
    }
    if (!username.trim()) {
      setError("Enter your username");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), pin);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || "Wrong username or PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  const numpad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["⌫", "0", "✓"],
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 pb-24 pt-16">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-400">
          <img src="/swami.jpg" alt="HPYS" className="w-full h-full object-cover object-top" />
        </div>
        <span
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize: "26px",
            color: "#FCD34D",
          }}
        >
          Event Manager
        </span>
      </div>

      <div className="w-full max-w-xs">
        {/* Username input */}
        <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1 text-center">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest mb-6 focus:outline-none focus:border-orange-400 placeholder-gray-600"
        />

        {/* PIN dots */}
        <p className="text-gray-400 text-xs uppercase tracking-widest text-center mb-4">
          PIN
        </p>
        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: MAX_PIN }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "2px solid",
                borderColor: i < pin.length ? "#EA580C" : "#4B5563",
                backgroundColor: i < pin.length ? "#EA580C" : "transparent",
                transition: "all 0.1s",
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {numpad.flat().map((key) => {
            const isBackspace = key === "⌫";
            const isConfirm = key === "✓";
            return (
              <button
                key={key}
                onClick={() => {
                  if (isBackspace) backspace();
                  else if (isConfirm) submit();
                  else pressDigit(key);
                }}
                disabled={loading}
                style={{
                  padding: "18px 0",
                  borderRadius: "14px",
                  border: "none",
                  fontSize: isBackspace || isConfirm ? "20px" : "22px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  backgroundColor: isConfirm
                    ? pin.length === MAX_PIN
                      ? "#EA580C"
                      : "#374151"
                    : isBackspace
                    ? "#1F2937"
                    : "#1F2937",
                  color: isConfirm
                    ? pin.length === MAX_PIN
                      ? "#fff"
                      : "#6B7280"
                    : "#F9FAFB",
                  transition: "background-color 0.15s",
                }}
              >
                {loading && isConfirm ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>

        {/* Link to signup */}
        <p className="text-center text-gray-500 text-sm mt-8">
          No account yet?{" "}
          <Link to="/signup" className="text-orange-400 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
