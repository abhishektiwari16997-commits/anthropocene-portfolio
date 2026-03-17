import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { useCursor } from "../context/CursorContext";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

interface FloatingSubLinkProps {
  to: string;
  text: string;
  duration: number;
  style: React.CSSProperties;
  ocid: string;
}

function FloatingSubLink({
  to,
  text,
  duration,
  style,
  ocid,
}: FloatingSubLinkProps) {
  const navigate = useNavigate();
  const { setIsHoveringCTA } = useCursor();
  const [isHovered, setIsHovered] = useState(false);

  const floatVariants = {
    float: {
      y: [-12, 12, -12],
      x: [-4, 4, -4],
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
          fontSize: "clamp(10px, 1vw, 13px)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: isHovered ? "rgba(229,224,216,1)" : "rgba(229,224,216,0.55)",
          transition: "color 0.3s ease",
          cursor: "none",
          maxWidth: "260px",
          lineHeight: 1.6,
          textAlign: "left",
        }}
      >
        {text}
      </button>
    </motion.div>
  );
}

export function FacultyLanding() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const mobileLinks = [
    {
      to: "/faculty/lectures",
      text: "Lectures",
      ocid: "faculty.lectures.button",
    },
    {
      to: "/faculty/students-works",
      text: "Students Works",
      ocid: "faculty.students.button",
    },
    {
      to: "/faculty/portfolio",
      text: "Design Portfolio",
      ocid: "faculty.portfolio.button",
    },
    { to: "/faculty/cv", text: "CV", ocid: "faculty.cv.button" },
  ];

  return (
    <div
      data-ocid="faculty.page"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        backgroundColor: "#000000",
        overflow: "hidden",
        cursor: "none",
      }}
    >
      {/* Grain overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          backgroundImage: GRAIN_SVG,
          opacity: 0.038,
        }}
      />

      {/* Anchor back to home */}
      <AnthropoceneAnchor />

      {/* Center content */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "10px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(229, 224, 216, 0.35)",
            marginBottom: "1.25rem",
          }}
        >
          Design Faculty & Design Portfolio
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: "clamp(44px, 7vw, 110px)",
            color: "#E5E0D8",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            margin: 0,
            textShadow: "0 2px 40px rgba(140,58,58,0.3)",
            textAlign: "center",
          }}
        >
          Anthropocene
        </motion.h1>
      </div>

      {/* Mobile: stacked vertical nav at bottom */}
      {isMobile ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          style={{
            position: "fixed",
            bottom: "5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.85rem",
            width: "90vw",
            maxWidth: "320px",
          }}
        >
          {mobileLinks.map(({ to, text, ocid }) => (
            <button
              key={to}
              type="button"
              data-ocid={ocid}
              onClick={() =>
                void navigate({ to } as Parameters<typeof navigate>[0])
              }
              style={{
                background: "none",
                border: "none",
                padding: "10px 0",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.65)",
                cursor: "default",
                width: "100%",
                textAlign: "center",
                lineHeight: 1.6,
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {text}
            </button>
          ))}
        </motion.div>
      ) : (
        <>
          {/* Desktop: floating absolute-positioned links */}
          <FloatingSubLink
            to="/faculty/lectures"
            text="Lectures"
            duration={6}
            ocid="faculty.lectures.button"
            style={{ top: "30%", left: "10%" }}
          />
          <FloatingSubLink
            to="/faculty/students-works"
            text="Students Works"
            duration={8}
            ocid="faculty.students.button"
            style={{ top: "60%", right: "12%" }}
          />
          <FloatingSubLink
            to="/faculty/portfolio"
            text="Design Portfolio"
            duration={10}
            ocid="faculty.portfolio.button"
            style={{ top: "44%", left: "62%" }}
          />
          <FloatingSubLink
            to="/faculty/cv"
            text="CV"
            duration={7}
            ocid="faculty.cv.button"
            style={{ top: "22%", right: "18%" }}
          />
        </>
      )}

      {/* Footer attribution */}
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
            color: "rgba(229,224,216,0.2)",
            textAlign: "center",
            margin: 0,
          }}
        >
          © 2026. Abhishek Tiwari
        </p>
      </div>
    </div>
  );
}
