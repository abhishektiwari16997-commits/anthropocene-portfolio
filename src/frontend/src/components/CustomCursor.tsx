import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";
import { useCursor } from "../context/CursorContext";

export function CustomCursor() {
  const { isRevealed, isHoveringCTA, cursorLabel, suppressDefaultLabel } =
    useCursor();
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 500, damping: 40 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 40 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [cursorX, cursorY]);

  const dotSize = isRevealed ? 6 : 10;
  const dotColor = isHoveringCTA ? "#8C3A3A" : "#E5E0D8";

  // Label visibility logic:
  // - cursorLabel set → always show it
  // - suppressDefaultLabel → never show the default "Click to enable sound" label
  // - no cursorLabel, not revealed, not suppressed → show default label
  // - no cursorLabel, revealed → hide
  const showDefaultLabel = !isRevealed && !cursorLabel && !suppressDefaultLabel;
  const showCustomLabel = !!cursorLabel;
  const labelVisible = showDefaultLabel || showCustomLabel;
  const labelText = cursorLabel || "Click to enable sound & reveal";

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {/* Dot */}
      <motion.div
        animate={{ width: dotSize, height: dotSize, backgroundColor: dotColor }}
        transition={{ duration: 0.4 }}
        style={{
          borderRadius: "50%",
        }}
      />
      {/* Label */}
      <motion.span
        animate={{ opacity: labelVisible ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "absolute",
          top: "50%",
          left: "16px",
          transform: "translateY(-50%)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "11px",
          letterSpacing: "0.12em",
          color: showCustomLabel
            ? "rgba(229, 224, 216, 0.9)"
            : "rgba(229, 224, 216, 0.7)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {labelText}
      </motion.span>
    </motion.div>
  );
}
