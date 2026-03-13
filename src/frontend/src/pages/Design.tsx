import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";

export function Design() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#1A1A1A",
        position: "relative",
      }}
    >
      {/* Grain texture */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(229, 224, 216, 0.40)",
            marginBottom: "1.5rem",
          }}
        >
          Pedagogy · Visual Identity · Built Environment
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif"
          style={{
            fontSize: "clamp(32px, 5vw, 72px)",
            color: "#E5E0D8",
            fontStyle: "italic",
            marginBottom: "2rem",
            fontWeight: 900,
          }}
        >
          Coming Soon — Design
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            to="/"
            data-ocid="design.back.link"
            style={{
              color: "rgba(229,224,216,0.5)",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "color 0.3s ease",
            }}
          >
            ← Back
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
