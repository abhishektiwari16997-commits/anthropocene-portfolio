import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const STORAGE_KEY = "anthropocene_admin_claimed";
const ADMIN_TOKEN = "Anthropocene@2026";

// Exported so AdminDashboard header can trigger it via double-click
export const STEALTH_TRIGGER_EVENT = "anthropocene:stealth-trigger";

export function StealthAdminClaim() {
  const { actor, isFetching: isActorFetching } = useActor();
  const { identity, login, isInitializing } = useInternetIdentity();
  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [status, setStatus] = useState<
    "idle" | "claiming" | "success" | "error"
  >("idle");
  const hasVerifiedRef = useRef(false);

  // On mount, always verify actual admin status regardless of localStorage flag
  // This ensures the claim button re-appears after backend redeployments
  useEffect(() => {
    if (hasVerifiedRef.current || !actor || isActorFetching || isInitializing)
      return;
    hasVerifiedRef.current = true;
    actor
      .isCallerAdmin()
      .then((isAdmin) => {
        if (isAdmin) {
          localStorage.setItem(STORAGE_KEY, "true");
          setClaimed(true);
        } else {
          // Not actually admin (backend was redeployed) — reset so claim can show again
          localStorage.removeItem(STORAGE_KEY);
          setClaimed(false);
        }
      })
      .catch(() => {
        // On error, reset to allow reclaim
        localStorage.removeItem(STORAGE_KEY);
        setClaimed(false);
      });
  }, [actor, isActorFetching, isInitializing]);

  // Keyboard shortcut: Ctrl + Alt + A (works on Mac and Windows, no browser conflict)
  useEffect(() => {
    if (claimed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === "a") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [claimed]);

  // Double-click on header event trigger
  useEffect(() => {
    if (claimed) return;
    const handler = () => setVisible((v) => !v);
    window.addEventListener(STEALTH_TRIGGER_EVENT, handler);
    return () => window.removeEventListener(STEALTH_TRIGGER_EVENT, handler);
  }, [claimed]);

  const handleClaim = useCallback(async () => {
    if (!identity) {
      login();
      return;
    }
    if (!actor) return;
    setStatus("claiming");
    try {
      await actor._initializeAccessControlWithSecret(ADMIN_TOKEN);
      const isAdmin = await actor.isCallerAdmin();
      if (isAdmin) {
        localStorage.setItem(STORAGE_KEY, "true");
        setStatus("success");
        setTimeout(() => {
          setClaimed(true);
          setVisible(false);
        }, 800);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [actor, identity, login]);

  // Completely unmounted if admin already claimed
  if (claimed) return null;
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.5rem",
        pointerEvents: "auto",
      }}
    >
      <button
        type="button"
        data-ocid="stealth.claim.button"
        onClick={handleClaim}
        disabled={status === "claiming" || status === "success"}
        style={{
          background: "transparent",
          border: "1px solid rgba(210,180,140,0.25)",
          color: "rgba(210,180,140,0.55)",
          fontFamily: "'Playfair Display', serif",
          fontSize: "0.65rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          padding: "0.5rem 1rem",
          cursor: status === "claiming" ? "wait" : "pointer",
          transition: "opacity 0.3s",
          opacity: status === "success" ? 1 : 0.6,
          outline: "none",
        }}
      >
        {status === "claiming"
          ? "Claiming..."
          : status === "success"
            ? "Admin Claimed"
            : status === "error"
              ? "Failed — Retry"
              : !identity
                ? "Connect Identity First"
                : "Claim Admin"}
      </button>
    </div>
  );
}
