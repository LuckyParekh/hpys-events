import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState("pin");   // "pin" | "confirm"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const MAX_PIN = 6;

  function pressDigit(d) {
    if (step === "pin" && pin.length < MAX_PIN) setPin((p) => p + d);
    if (step === "confirm" && confirmPin.length < MAX_PIN) setConfirmPin((p) => p + d);
  }

  function backspace() {
    if (step === "pin") setPin((p) => p.slice(0, -1));
    if (step === "confirm") setConfirmPin((p) => p.slice(0, -1));
  }

  async function submit() {
    setError("");

    if (!name.trim()) { setError("Enter your name"); return; }
    if (!username.trim()) { setError("Enter a username"); return; }

    // Step 1: enter PIN
    if (step === "pin") {
      if (pin.length !== MAX_PIN) { setError("Enter all 6 digits"); return; }
      setStep("confirm");
      return;
    }

    // Step 2: confirm PIN
    if (confirmPin.length !== MAX_PIN) { setError("Enter all 6 digits to confirm"); return; }
    if (pin !== confirmPin) {
      setError("PINs don't match — try again");
      setPin("");
      setConfirmPin("");
      setStep("pin");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), email: email.trim() || undefined, pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }
      // Auto-login after signup
      await login(username.trim(), pin);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e.message || "Something went wrong");
      setPin("");
      setConfirmPin("");
      setStep("pin");
    } finally {
      setLoading(false);
    }
  }

  const currentPin = step === "pin" ? pin : confirmPin;

  const numpad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["⌫", "0", "✓"],
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 pb-24 pt-16">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-400">
          <img src="/swami.jpg" alt="HPYS" className="w-full h-full object-cover object-top" />
        </div>
        <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: "26px", color: "#FCD34D" }}>
          Event Manager
        </span>
      </div>

      <div className="w-full max-w-xs">
        <h2 className="text-white text-xl font-bold text-center mb-6">Create Account</h2>

        {/* Name */}
        <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1 text-center">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg mb-3 focus:outline-none focus:border-orange-400 placeholder-gray-600"
        />

        {/* Email */}
        <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1 text-center">Email <span className="normal-case text-gray-600">(optional)</span></label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg mb-3 focus:outline-none focus:border-orange-400 placeholder-gray-600"
        />

        {/* Username */}
        <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1 text-center">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
          placeholder="choose a username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg mb-6 focus:outline-none focus:border-orange-400 placeholder-gray-600"
        />

        {/* PIN label */}
        <p className="text-gray-400 text-xs uppercase tracking-widest text-center mb-4">
          {step === "pin" ? "Choose a 6-digit PIN" : "Confirm your PIN"}
        </p>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: MAX_PIN }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "2px solid",
                borderColor: i < currentPin.length ? "#EA580C" : "#4B5563",
                backgroundColor: i < currentPin.length ? "#EA580C" : "transparent",
                transition: "all 0.1s",
              }}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {["pin", "confirm"].map((s) => (
            <div
              key={s}
              style={{
                width: "8px", height: "8px", borderRadius: "50%",
                backgroundColor: step === s ? "#EA580C" : "#374151",
                transition: "background-color 0.15s",
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
            const pinFull = currentPin.length === MAX_PIN;
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
                    ? pinFull ? "#EA580C" : "#374151"
                    : "#1F2937",
                  color: isConfirm
                    ? pinFull ? "#fff" : "#6B7280"
                    : "#F9FAFB",
                  transition: "background-color 0.15s",
                }}
              >
                {loading && isConfirm ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : key}
              </button>
            );
          })}
        </div>

        {/* Link to login */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-400 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
