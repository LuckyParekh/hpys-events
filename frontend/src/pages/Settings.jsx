import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

const MAX_PIN = 6;

// ── PIN numpad used for Change PIN flow ───────────────────────────────────────
function PinNumpad({ value, onChange, onSubmit, onBack, label, loading }) {
  function pressDigit(d) {
    if (value.length < MAX_PIN) onChange(value + d);
  }
  function backspace() {
    onChange(value.slice(0, -1));
  }

  const numpad = [
    ["1","2","3"],
    ["4","5","6"],
    ["7","8","9"],
    ["⌫","0","✓"],
  ];

  return (
    <div>
      <p style={{ fontSize: "12px", color: "var(--t4)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
        {label}
      </p>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        {Array.from({ length: MAX_PIN }).map((_, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: "50%",
            border: "2px solid",
            borderColor: i < value.length ? "#EA580C" : "var(--bg-el2)",
            backgroundColor: i < value.length ? "#EA580C" : "transparent",
            transition: "all 0.1s",
          }} />
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {numpad.flat().map((key) => {
          const isBack = key === "⌫";
          const isOk   = key === "✓";
          const full   = value.length === MAX_PIN;
          return (
            <button
              key={key}
              onClick={() => {
                if (isBack) backspace();
                else if (isOk) onSubmit();
                else pressDigit(key);
              }}
              disabled={loading}
              style={{
                padding: "16px 0",
                borderRadius: "12px",
                border: "none",
                fontSize: isBack || isOk ? "18px" : "20px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                backgroundColor: isOk
                  ? full ? "#EA580C" : "var(--bg-el)"
                  : "var(--bg-el)",
                color: isOk
                  ? full ? "#fff" : "var(--t5)"
                  : "var(--t1)",
                transition: "background-color 0.15s",
              }}
            >
              {loading && isOk ? "…" : key}
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        style={{ width: "100%", marginTop: "14px", background: "none", border: "none", color: "var(--t4)", fontSize: "13px", cursor: "pointer", textAlign: "center" }}
      >
        Cancel
      </button>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p style={{ fontSize: "11px", color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", paddingLeft: "4px" }}>
        {title}
      </p>
      <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ── Row inside a section ──────────────────────────────────────────────────────
function Row({ icon, label, right, onClick, last, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "14px 16px",
        borderBottom: last ? "none" : "1px solid var(--border)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: "8px", backgroundColor: "var(--bg-el)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: "14px", color: danger ? "#F87171" : "var(--t1)", fontWeight: "500" }}>{label}</span>
      {right}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      style={{
        width: 44, height: 26, borderRadius: 13,
        backgroundColor: on ? "#EA580C" : "var(--bg-el2)",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 0.2s", flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%",
        backgroundColor: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }} />
    </div>
  );
}

// ── Main Settings page ────────────────────────────────────────────────────────
export default function Settings() {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [pinStep, setPinStep] = useState(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin]         = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg]         = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  const [notifPush, setNotifPush]   = useState(false);
  const [notifEmail, setNotifEmail] = useState(false);

  if (!user) { navigate("/login"); return null; }

  function startChangePIN() {
    setCurrentPin(""); setNewPin(""); setConfirmPin("");
    setPinMsg(""); setPinSuccess(false);
    setPinStep("current");
  }
  function cancelPin() {
    setPinStep(null); setCurrentPin(""); setNewPin(""); setConfirmPin(""); setPinMsg("");
  }

  async function handlePinSubmit() {
    setPinMsg("");
    if (pinStep === "current") {
      if (currentPin.length !== MAX_PIN) { setPinMsg("Enter all 6 digits"); return; }
      setPinStep("new");
    } else if (pinStep === "new") {
      if (newPin.length !== MAX_PIN) { setPinMsg("Enter all 6 digits"); return; }
      setPinStep("confirm");
    } else if (pinStep === "confirm") {
      if (confirmPin.length !== MAX_PIN) { setPinMsg("Enter all 6 digits"); return; }
      if (newPin !== confirmPin) {
        setPinMsg("PINs don't match — try again");
        setNewPin(""); setConfirmPin(""); setPinStep("new");
        return;
      }
      setPinLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/me/pin`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ old_pin: currentPin, new_pin: newPin }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Failed to change PIN");
        setPinSuccess(true);
        setPinStep(null);
      } catch (e) {
        setPinMsg(e.message);
        setCurrentPin(""); setNewPin(""); setConfirmPin(""); setPinStep("current");
      } finally {
        setPinLoading(false);
      }
    }
  }

  // ── Render PIN flow ──────────────────────────────────────────────────────
  if (pinStep) {
    const pinLabels  = { current: "Enter your current PIN", new: "Choose a new PIN", confirm: "Confirm your new PIN" };
    const pinValues  = { current: currentPin, new: newPin, confirm: confirmPin };
    const pinSetters = { current: setCurrentPin, new: setNewPin, confirm: setConfirmPin };
    const steps = ["current", "new", "confirm"];
    const stepIndex = steps.indexOf(pinStep);

    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)", paddingTop: "56px", paddingBottom: "96px" }}>
        <div style={{ maxWidth: "360px", margin: "0 auto", padding: "24px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <button onClick={cancelPin} style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--t4)", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>
              <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 style={{ fontSize: "17px", fontWeight: "700", color: "var(--t1)", margin: 0 }}>Change PIN</h1>
            <div style={{ width: 40 }} />
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "28px" }}>
            {steps.map((s, i) => (
              <div key={s} style={{
                height: 4, width: i <= stepIndex ? 28 : 12, borderRadius: 2,
                backgroundColor: i <= stepIndex ? "#EA580C" : "var(--bg-el)",
                transition: "all 0.2s",
              }} />
            ))}
          </div>

          {pinMsg && (
            <p style={{ color: "#F87171", fontSize: "13px", textAlign: "center", marginBottom: "16px" }}>{pinMsg}</p>
          )}

          <PinNumpad
            value={pinValues[pinStep]}
            onChange={pinSetters[pinStep]}
            onSubmit={handlePinSubmit}
            onBack={cancelPin}
            label={pinLabels[pinStep]}
            loading={pinLoading}
          />
        </div>
      </div>
    );
  }

  // ── Main settings view ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-page)", paddingTop: "56px", paddingBottom: "96px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "24px 16px 0" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--t4)", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)", margin: 0 }}>Settings</h1>
          <div style={{ width: 40 }} />
        </div>

        {/* PIN success banner */}
        {pinSuccess && (
          <div style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg style={{ width: 16, height: 16, color: "#22C55E", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span style={{ fontSize: "13px", color: "#22C55E", fontWeight: "500" }}>PIN changed successfully</span>
          </div>
        )}

        {/* ── Account security ── */}
        <Section title="Account Security">
          <Row
            icon={
              <svg style={{ width: 16, height: 16, color: "#EA580C" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            label="Change PIN"
            right={
              <svg style={{ width: 14, height: 14, color: "var(--t5)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
            onClick={startChangePIN}
            last
          />
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications">
          <Row
            icon={
              <svg style={{ width: 16, height: 16, color: "#818CF8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            label="Push Notifications"
            right={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--t5)" }}>Coming soon</span>
                <Toggle on={notifPush} onToggle={() => setNotifPush(v => !v)} disabled />
              </div>
            }
          />
          <Row
            icon={
              <svg style={{ width: 16, height: 16, color: "#818CF8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            label="Email Notifications"
            right={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--t5)" }}>Coming soon</span>
                <Toggle on={notifEmail} onToggle={() => setNotifEmail(v => !v)} disabled />
              </div>
            }
            last
          />
        </Section>

        {/* ── Appearance ── */}
        <Section title="Appearance">
          <Row
            icon={
              theme === "dark"
                ? <svg style={{ width: 16, height: 16, color: "#FBBF24" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                : <svg style={{ width: 16, height: 16, color: "#FBBF24" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
            }
            label={theme === "dark" ? "Dark Mode" : "Light Mode"}
            right={<Toggle on={theme === "dark"} onToggle={toggleTheme} />}
            last
          />
        </Section>

        {/* ── Contact ── */}
        <Section title="Contact & Support">
          <Row
            icon={
              <svg style={{ width: 16, height: 16, color: "#34D399" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            label="Contact Admin"
            right={
              <a href="mailto:hpys.scarborough@gmail.com" style={{ fontSize: "12px", color: "#EA580C", textDecoration: "none" }}>
                hpys.scarborough@gmail.com
              </a>
            }
          />
          <Row
            icon={
              <svg style={{ width: 16, height: 16, color: "#34D399" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="About"
            right={<span style={{ fontSize: "12px", color: "var(--t5)" }}>HPYS Events v1.0</span>}
            last
          />
        </Section>

      </div>
    </div>
  );
}
