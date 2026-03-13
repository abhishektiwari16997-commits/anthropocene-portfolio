import { useNavigate } from "@tanstack/react-router";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCursor } from "../context/CursorContext";

const VIDEO_URL =
  "https://res.cloudinary.com/dvmvka9ll/video/upload/v1772337302/Comp_2_gzagzw.mp4";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

interface FloatingLinkProps {
  to: string;
  text: string;
  duration: number;
  style: React.CSSProperties;
  ocid: string;
  index: number;
}

function FloatingLink({ to, text, duration, style, ocid }: FloatingLinkProps) {
  const navigate = useNavigate();
  const { setIsHoveringCTA } = useCursor();
  const [isHovered, setIsHovered] = useState(false);

  const floatVariants = {
    float: {
      y: [-15, 15, -15],
      x: [-5, 5, -5],
      transition: {
        duration,
        ease: "easeInOut" as const,
        repeat: Number.POSITIVE_INFINITY,
      },
    },
    hover: {
      y: 0,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={floatVariants}
      animate={isHovered ? "hover" : "float"}
      style={{
        position: "absolute",
        ...style,
        zIndex: 30,
      }}
      onHoverStart={() => {
        setIsHovered(true);
        setIsHoveringCTA(true);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        setIsHoveringCTA(false);
      }}
    >
      <button
        type="button"
        data-ocid={ocid}
        onClick={(e) => {
          e.stopPropagation();
          void navigate({ to } as Parameters<typeof navigate>[0]);
        }}
        style={{
          background: "none",
          border: "none",
          padding: "8px 0",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "clamp(11px, 1.1vw, 14px)",
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          color: isHovered ? "rgba(229,224,216,1)" : "rgba(229,224,216,0.65)",
          transition: "color 0.3s ease",
          cursor: "none",
          maxWidth: "280px",
          lineHeight: 1.6,
          textAlign: "left" as const,
        }}
      >
        {text}
      </button>
    </motion.div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setIsRevealed } = useCursor();
  const [hasRevealed, setHasRevealed] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Raw mouse position
  const rawX = useMotionValue(
    typeof window !== "undefined" ? window.innerWidth / 2 : 0,
  );
  const rawY = useMotionValue(
    typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  );

  // Smoothed mouse position
  const smoothX = useSpring(rawX, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(rawY, { stiffness: 300, damping: 30 });

  // Mask size as motion value
  const maskSize = useMotionValue(200);

  // Build the CSS mask from live motion values
  const maskImage = useMotionTemplate`radial-gradient(circle at ${smoothX}px ${smoothY}px, black ${maskSize}px, transparent calc(${maskSize}px + 100px))`;

  // Track mouse
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY]);

  // Touch device: immediately reveal
  useEffect(() => {
    const isTouch = "ontouchstart" in window;
    if (isTouch) {
      maskSize.set(3000);
      setHasRevealed(true);
      setIsRevealed(true);
    }
  }, [maskSize, setIsRevealed]);

  const handleReveal = () => {
    if (hasRevealed) return;
    setHasRevealed(true);
    setIsRevealed(true);

    // Unmute video imperatively — React doesn't update the muted DOM attribute reactively
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 0.15;
    }

    // Animate mask from flashlight to full reveal
    animate(maskSize, 3000, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
    });
  };

  return (
    <div
      data-ocid="home.page"
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#000000",
        cursor: "none",
      }}
    >
      {/* ── Video mask wrapper ─────────────────────────────────────── */}
      <motion.div
        style={{
          position: "fixed",
          inset: 0,
          WebkitMaskImage: maskImage,
          maskImage: maskImage,
          zIndex: 1,
        }}
      >
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          loop
          playsInline
          muted
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </motion.div>

      {/* ── Dark overlay above video, below content ────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          background: "rgba(0,0,0,0.22)",
          pointerEvents: "none",
        }}
      />

      {/* ── Grain texture overlay ──────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          backgroundImage: GRAIN_SVG,
          opacity: 0.035,
        }}
      />

      {/* ── Click-capture + content layer ─────────────────────────── */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: immersive canvas interaction with custom cursor */}
      <div
        onClick={handleReveal}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          cursor: "none",
        }}
      >
        {/* Fixed centered title */}
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 20,
            textAlign: "center",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <motion.h1
            className="font-serif"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{
              fontSize: "clamp(60px, 10vw, 160px)",
              fontWeight: 900,
              fontStyle: "italic",
              color: "#E5E0D8",
              lineHeight: 0.9,
              textShadow: "0 2px 60px rgba(140,58,58,0.4)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Anthropocene
          </motion.h1>
        </div>

        {/* ── Floating CTAs — stacked vertically on mobile, absolute positioned on desktop ── */}
        {isMobile ? (
          <div
            style={{
              position: "fixed",
              bottom: "5.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 30,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
              width: "90vw",
              maxWidth: "320px",
            }}
          >
            {[
              {
                to: "/faculty",
                text: "Design Faculty & Portfolio",
                ocid: "home.nav.link.1",
              },
              {
                to: "/art-practice",
                text: "Art Practice",
                ocid: "home.nav.link.2",
              },
              { to: "/research", text: "Research", ocid: "home.nav.link.3" },
            ].map(({ to, text, ocid }) => (
              <button
                key={to}
                type="button"
                data-ocid={ocid}
                onClick={(e) => {
                  e.stopPropagation();
                  void navigate({ to } as Parameters<typeof navigate>[0]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: "8px 0",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(229,224,216,0.75)",
                  cursor: "default",
                  width: "100%",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                {text}
              </button>
            ))}
          </div>
        ) : (
          <>
            <FloatingLink
              to="/faculty"
              text="Anthropocene: Design Faculty & Design Portfolio"
              duration={6}
              ocid="home.nav.link.1"
              index={1}
              style={{ top: "28%", left: "8%" }}
            />

            <FloatingLink
              to="/art-practice"
              text="Anthropocene: Art Practice"
              duration={8}
              ocid="home.nav.link.2"
              index={2}
              style={{ top: "62%", right: "10%" }}
            />

            <FloatingLink
              to="/research"
              text="Anthropocene: Research"
              duration={10}
              ocid="home.nav.link.3"
              index={3}
              style={{ top: "42%", left: "55%" }}
            />
          </>
        )}
      </div>

      {/* ── View Research link ────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: "3.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 15,
        }}
      >
        <button
          type="button"
          data-ocid="home.research.link"
          onClick={() => void navigate({ to: "/research" })}
          style={{
            background: "none",
            border: "none",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "9px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(229,224,216,0.3)",
            cursor: "none",
            padding: "0.5rem",
            transition: "color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(229,224,216,0.7)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(229,224,216,0.3)";
          }}
        >
          View Research →
        </button>
      </div>

      {/* ── Footer attribution ────────────────────────────────────── */}
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
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "10px",
            letterSpacing: "0.15em",
            color: "rgba(229,224,216,0.25)",
            textAlign: "center",
            margin: 0,
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
              color: "rgba(229,224,216,0.35)",
              textDecoration: "none",
              pointerEvents: "auto",
              cursor: "none",
            }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
