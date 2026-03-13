import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCursor } from "../context/CursorContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// useInternetIdentity is imported so the hook context is initialized correctly
// but II login is now handled on the dashboard, not the login page.

function CursorReset() {
  const { setIsRevealed, setCursorLabel, setSuppressDefaultLabel } =
    useCursor();
  useEffect(() => {
    setIsRevealed(true);
    setCursorLabel("");
    setSuppressDefaultLabel(true);
    return () => {
      setCursorLabel("");
      setSuppressDefaultLabel(false);
    };
  }, [setIsRevealed, setCursorLabel, setSuppressDefaultLabel]);
  return null;
}

export function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  // Keep hook instantiated for context initialisation; II login happens on dashboard
  useInternetIdentity();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHoveringBtn, setIsHoveringBtn] = useState(false);

  const handleEnter = async () => {
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError(null);
    setIsLoading(true);
    const success = await login(password);
    if (!success) {
      setIsLoading(false);
      setError("Incorrect password.");
      return;
    }

    // Password accepted — navigate directly to dashboard.
    // The dashboard will prompt for Internet Identity if needed.
    navigate({ to: "/admin/dashboard" });
  };

  const isButtonLoading = isLoading;

  return (
    <div
      data-ocid="admin.page"
      style={{
        minHeight: "100dvh",
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "default",
      }}
    >
      <CursorReset />

      {/* Subtle scanline overlay for brutalist depth */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(229,224,216,0.012) 2px, rgba(229,224,216,0.012) 4px)",
        }}
      />

      {/* Top-left system label */}
      <div
        style={{
          position: "fixed",
          top: "2rem",
          left: "2rem",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
            fontSize: "9px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(229,224,216,0.2)",
            margin: 0,
          }}
        >
          Anthropocene — CMS
        </p>
      </div>

      {/* Top-right version tag */}
      <div
        style={{
          position: "fixed",
          top: "2rem",
          right: "2rem",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
            fontSize: "9px",
            letterSpacing: "0.2em",
            color: "rgba(229,224,216,0.15)",
            margin: 0,
          }}
        >
          v1.0 · ICP Backend
        </p>
      </div>

      {/* Main form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 5,
          width: "100%",
          maxWidth: "360px",
          padding: "0 1.5rem",
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: "3.5rem" }}>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 800,
              fontSize: "clamp(28px, 5vw, 42px)",
              color: "#E5E0D8",
              margin: "0 0 0.5rem",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Control Panel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "9px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(229,224,216,0.3)",
              margin: 0,
            }}
          >
            Enter password to continue
          </motion.p>
        </div>

        {/* Form fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: "0" }}
        >
          {/* Password field */}
          <div style={{ marginBottom: "2.5rem" }}>
            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "9px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.4)",
                marginBottom: "0.6rem",
                cursor: "default",
              }}
            >
              Password
            </label>
            <input
              id="admin-password"
              data-ocid="admin.password.input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEnter();
              }}
              disabled={isLoading}
              style={{
                width: "100%",
                background: "#1a1a1a",
                border: "1px solid rgba(229,224,216,0.18)",
                borderRadius: "0",
                padding: "0.875rem 1rem",
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "13px",
                color: "#E5E0D8",
                outline: "none",
                transition: "border-color 0.25s ease",
                cursor: isLoading ? "default" : "text",
                boxSizing: "border-box",
                opacity: isLoading ? 0.5 : 1,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(229,224,216,0.55)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(229,224,216,0.18)";
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              data-ocid="admin.login.error_state"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "#8C3A3A",
                marginBottom: "1.25rem",
                lineHeight: 1.5,
              }}
            >
              {error}
            </motion.p>
          )}

          {/* Enter button */}
          <button
            type="button"
            data-ocid="admin.submit_button"
            onClick={handleEnter}
            disabled={isButtonLoading}
            onMouseEnter={() => setIsHoveringBtn(true)}
            onMouseLeave={() => setIsHoveringBtn(false)}
            style={{
              width: "100%",
              background:
                isHoveringBtn && !isButtonLoading ? "#8C3A3A" : "transparent",
              border: "1px solid rgba(229,224,216,0.3)",
              borderRadius: "0",
              padding: "1rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "10px",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: isButtonLoading ? "rgba(229,224,216,0.35)" : "#E5E0D8",
              cursor: "default",
              transition:
                "background 0.3s ease, border-color 0.3s ease, color 0.2s ease",
              opacity: isButtonLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Verifying..." : "Enter"}
          </button>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "rgba(229,224,216,0.12)",
            textAlign: "center",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(229,224,216,0.22)",
              textDecoration: "none",
              pointerEvents: "auto",
              cursor: "default",
            }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
