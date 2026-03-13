import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCursor } from "../context/CursorContext";

const SUB_LINKS = [
  { label: "Lectures", to: "/faculty/lectures" },
  { label: "Students Works", to: "/faculty/students-works" },
  { label: "Design Portfolio", to: "/faculty/portfolio" },
  { label: "CV", to: "/faculty/cv" },
] as const;

function SubNavLink({
  label,
  to,
  isActive,
  delay,
}: {
  label: string;
  to: string;
  isActive: boolean;
  delay: number;
}) {
  const { setIsHoveringCTA } = useCursor();
  const [isHovered, setIsHovered] = useState(false);

  const floatVariants = {
    float: {
      y: [-4, 4, -4],
      transition: {
        duration: 4 + delay * 1.5,
        ease: "easeInOut" as const,
        repeat: Number.POSITIVE_INFINITY,
      },
    },
    hover: {
      y: 0,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      variants={floatVariants}
      animate={isHovered ? "hover" : "float"}
      onHoverStart={() => {
        setIsHovered(true);
        setIsHoveringCTA(true);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        setIsHoveringCTA(false);
      }}
    >
      <Link
        to={to}
        data-ocid="faculty.subnav.link"
        style={{
          textDecoration: "none",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: isActive
            ? "rgba(229, 224, 216, 1)"
            : isHovered
              ? "rgba(229, 224, 216, 0.85)"
              : "rgba(229, 224, 216, 0.4)",
          transition: "color 0.3s ease",
          cursor: "none",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Link>
    </motion.div>
  );
}

export function FacultySubNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: isMobile ? "1rem" : "2.5rem",
        paddingLeft: isMobile
          ? "1rem"
          : "calc(2rem + clamp(16px, 1.4vw, 22px) + 8rem)",
        paddingTop: "1.75rem",
        paddingBottom: "1.75rem",
        position: "relative",
        zIndex: 40,
      }}
    >
      {SUB_LINKS.map((link, i) => (
        <SubNavLink
          key={link.to}
          label={link.label}
          to={link.to}
          isActive={
            currentPath === link.to || currentPath.startsWith(`${link.to}/`)
          }
          delay={i}
        />
      ))}
    </nav>
  );
}
