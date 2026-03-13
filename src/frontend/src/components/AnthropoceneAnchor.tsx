import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCursor } from "../context/CursorContext";

export function AnthropoceneAnchor() {
  const { setIsHoveringCTA, setCursorLabel } = useCursor();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to="/"
      data-ocid="nav.home.link"
      onMouseEnter={() => {
        setIsHovered(true);
        setIsHoveringCTA(true);
        setCursorLabel("Return to Quarry");
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsHoveringCTA(false);
        setCursorLabel("");
      }}
      style={{
        position: "fixed",
        top: "2rem",
        left: "2rem",
        zIndex: 50,
        textDecoration: "none",
        fontFamily: '"Playfair Display", Georgia, serif',
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: "clamp(16px, 1.4vw, 22px)",
        letterSpacing: "-0.01em",
        color: isHovered ? "#8C3A3A" : "#E5E0D8",
        transition: "color 0.3s ease",
        cursor: "none",
        userSelect: "none",
      }}
    >
      Anthropocene
    </Link>
  );
}
