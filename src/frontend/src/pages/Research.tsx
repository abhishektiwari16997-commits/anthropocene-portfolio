import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ResearchItem } from "../backend.d";
import { useCursor } from "../context/CursorContext";
import { getBackend } from "../utils/getBackend";

// ─── Cursor reset ──────────────────────────────────────────────────────────────
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

// ─── Fallback instructional placeholders ─────────────────────────────────────
interface InstructionalPlaceholder {
  id: string;
  title: string;
  body: string;
  accentColor: string;
  width: number;
}

const INSTRUCTIONAL_PLACEHOLDERS: InstructionalPlaceholder[] = [
  {
    id: "placeholder-1",
    title: "Upload Your First Card",
    body: "Go to Admin → Manage Research → Add New Entry. Upload a Figma PNG and mark it Live — it will appear here as a floating card.",
    accentColor: "rgba(140,58,58,0.85)",
    width: 240,
  },
  {
    id: "placeholder-2",
    title: "Drag Me Anywhere",
    body: "Every card on this canvas is draggable. Rearrange your research thoughts freely — like pinning ideas to a physical mood board.",
    accentColor: "rgba(74,74,74,0.85)",
    width: 220,
  },
  {
    id: "placeholder-3",
    title: "Your Canvas Awaits",
    body: "This page will fill with your poems, essays, sketches, and research images. No structure — just floating thought.",
    accentColor: "rgba(229,224,216,0.12)",
    width: 230,
  },
];

// ─── Seeded random util (deterministic per card id) ──────────────────────────
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0) / 0xffffffff;
}

function seededRandomRange(seed: string, min: number, max: number) {
  return min + seededRandom(seed) * (max - min);
}

// ─── Expanded Card Overlay ────────────────────────────────────────────────────
interface ExpandedOverlayProps {
  imagePath?: string;
  title: string;
  description: string;
  onClose: () => void;
}

function ExpandedOverlay({
  imagePath,
  title,
  description,
  onClose,
}: ExpandedOverlayProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      data-ocid="research.card.modal"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.96)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
        padding: "2rem",
      }}
    >
      {/* Close button — top right */}
      <button
        type="button"
        data-ocid="research.card.close_button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "fixed",
          top: "1.75rem",
          right: "2rem",
          background: "none",
          border: "none",
          color: "rgba(229,224,216,0.4)",
          fontSize: "24px",
          cursor: "pointer",
          lineHeight: 1,
          padding: "0.5rem",
          transition: "color 0.2s ease",
          zIndex: 310,
          fontFamily: '"JetBrains Mono", monospace',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#8C3A3A";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "rgba(229,224,216,0.4)";
        }}
        aria-label="Close"
      >
        ×
      </button>

      {/* Content container — stop click propagation so clicking content doesn't close */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "768px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.75rem",
        }}
      >
        {/* Image */}
        {imagePath && (
          <div
            style={{
              width: "100%",
              maxHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={imagePath}
              alt={title}
              draggable={false}
              style={{
                maxHeight: "60vh",
                maxWidth: "100%",
                objectFit: "contain",
                display: "block",
                userSelect: "none",
              }}
            />
          </div>
        )}

        {/* Title */}
        {title && (
          <h2
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "clamp(22px, 4vw, 38px)",
              lineHeight: 1.25,
              color: "#E5E0D8",
              margin: 0,
              textAlign: "center",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p
            style={{
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "clamp(11px, 1.2vw, 13px)",
              lineHeight: 1.85,
              color: "rgba(229,224,216,0.65)",
              margin: 0,
              textAlign: "center",
              maxWidth: "600px",
            }}
          >
            {description}
          </p>
        )}

        {/* Hint to close */}
        <p
          style={{
            fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(229,224,216,0.2)",
            margin: 0,
          }}
        >
          click anywhere to close
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Image Card (Motoko-sourced card with image) ──────────────────────────────
interface ImageCardProps {
  item: ResearchItem;
  index: number;
  containerW: number;
  containerH: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function ImageCard({
  item,
  index,
  containerW,
  containerH,
  containerRef,
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Track drag distance to distinguish click from drag
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragMove = useRef(false);

  const id = `research-${item.id.toString()}`;

  const cardWidth = 260;

  const startX = useMemo(
    () =>
      seededRandomRange(
        `${id}x`,
        cardWidth * 0.1,
        Math.max(cardWidth, containerW - cardWidth - 40),
      ),
    [id, containerW],
  );

  const startY = useMemo(
    () => seededRandomRange(`${id}y`, 80, Math.max(120, containerH - 280)),
    [id, containerH],
  );

  const driftX = useMemo(() => seededRandomRange(`${id}dx`, 8, 22), [id]);
  const driftY = useMemo(() => seededRandomRange(`${id}dy`, 8, 22), [id]);
  const driftDuration = useMemo(
    () => seededRandomRange(`${id}dur`, 20, 45),
    [id],
  );
  const baseRotate = useMemo(
    () => seededRandomRange(`${id}rot`, -2.5, 2.5),
    [id],
  );
  const rotDrift = useMemo(
    () => seededRandomRange(`${id}rdrift`, 0.3, 1.2),
    [id],
  );

  // useMotionValue for stable drag position (no snap-back)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.15}
        dragConstraints={containerRef}
        _dragX={x}
        _dragY={y}
        onDragStart={(event) => {
          const e = event as PointerEvent;
          dragStartPos.current = { x: e.clientX, y: e.clientY };
          wasDragMove.current = false;
          setHasDragged(true);
        }}
        onDrag={(event) => {
          const e = event as PointerEvent;
          if (dragStartPos.current) {
            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;
            if (Math.sqrt(dx * dx + dy * dy) > 5) {
              wasDragMove.current = true;
            }
          }
        }}
        onDragEnd={() => {
          // do NOT reset x/y — card stays where dropped
        }}
        whileDrag={{ scale: 1.05, zIndex: 100 }}
        onClick={() => {
          if (!wasDragMove.current) {
            setIsExpanded(true);
          }
        }}
        style={{
          position: "absolute",
          left: startX,
          top: startY,
          width: cardWidth,
          x,
          y,
          zIndex: isHovered ? 60 : 10 + index,
          cursor: "grab",
          willChange: "transform",
          userSelect: "none",
          touchAction: "none",
        }}
        animate={
          hasDragged
            ? // After first drag: only static rotation, no drift (prevents snap-back)
              { rotate: baseRotate, scale: isHovered ? 1.03 : 1 }
            : isHovered
              ? { scale: 1.03, rotate: baseRotate }
              : {
                  x: [-driftX, driftX, -driftX],
                  y: [-driftY, driftY * 0.6, -driftY],
                  rotate: [baseRotate, baseRotate + rotDrift, baseRotate],
                }
        }
        transition={
          hasDragged || isHovered
            ? { duration: 0.3, ease: "easeOut" }
            : {
                duration: driftDuration,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                delay: index * 0.25,
              }
        }
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div
          style={{
            background: "rgba(10,10,10,0.92)",
            border: isHovered
              ? "1px solid rgba(140,58,58,0.4)"
              : "1px solid rgba(229,224,216,0.08)",
            borderRadius: "0",
            overflow: "hidden",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            boxShadow: isHovered
              ? "0 0 32px 6px rgba(140,58,58,0.5)"
              : "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Image — object-fit: contain so Figma PNGs are never cropped */}
          {item.imagePath && (
            <div
              style={{
                width: "100%",
                height: "200px",
                overflow: "hidden",
                flexShrink: 0,
                background: "#0a0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={item.imagePath}
                alt={item.title}
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            </div>
          )}

          {/* Title + description — appear on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  padding: "0.75rem 1rem",
                }}
              >
                {item.title && (
                  <p
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontStyle: "italic",
                      fontSize: "13px",
                      lineHeight: 1.4,
                      color: "#E5E0D8",
                      margin: "0 0 0.4rem",
                    }}
                  >
                    {item.title}
                  </p>
                )}
                {item.description && (
                  <p
                    style={{
                      fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                      fontSize: "10px",
                      lineHeight: 1.65,
                      color: "rgba(229,224,216,0.55)",
                      margin: 0,
                    }}
                  >
                    {item.description}
                  </p>
                )}
                <p
                  style={{
                    fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                    fontSize: "8px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(140,58,58,0.7)",
                    margin: "0.5rem 0 0",
                  }}
                >
                  click to expand
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Expanded full-screen overlay */}
      <AnimatePresence>
        {isExpanded && (
          <ExpandedOverlay
            imagePath={item.imagePath || undefined}
            title={item.title}
            description={item.description}
            onClose={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Instructional Placeholder Card ──────────────────────────────────────────
interface PlaceholderCardProps {
  card: InstructionalPlaceholder;
  index: number;
  containerW: number;
  containerH: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function PlaceholderCard({
  card,
  index,
  containerW,
  containerH,
  containerRef,
}: PlaceholderCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Track drag distance to distinguish click from drag
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragMove = useRef(false);

  // Spread the 3 cards across the canvas deterministically
  const positions = [
    { x: 0.18, y: 0.28 },
    { x: 0.52, y: 0.45 },
    { x: 0.34, y: 0.62 },
  ];
  const pos = positions[index] ?? { x: 0.3 + index * 0.2, y: 0.4 };

  const startX = Math.max(20, containerW * pos.x - card.width / 2);
  const startY = Math.max(80, containerH * pos.y - 80);

  const driftX = useMemo(
    () => seededRandomRange(`${card.id}dx`, 6, 16),
    [card.id],
  );
  const driftY = useMemo(
    () => seededRandomRange(`${card.id}dy`, 6, 16),
    [card.id],
  );
  const driftDuration = useMemo(
    () => seededRandomRange(`${card.id}dur`, 22, 42),
    [card.id],
  );
  const baseRotate = useMemo(
    () => seededRandomRange(`${card.id}rot`, -2, 2),
    [card.id],
  );
  const rotDrift = useMemo(
    () => seededRandomRange(`${card.id}rdrift`, 0.3, 1),
    [card.id],
  );

  // useMotionValue for stable drag position (no snap-back)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.15}
        dragConstraints={containerRef}
        _dragX={x}
        _dragY={y}
        onDragStart={(event) => {
          const e = event as PointerEvent;
          dragStartPos.current = { x: e.clientX, y: e.clientY };
          wasDragMove.current = false;
          setHasDragged(true);
        }}
        onDrag={(event) => {
          const e = event as PointerEvent;
          if (dragStartPos.current) {
            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;
            if (Math.sqrt(dx * dx + dy * dy) > 5) {
              wasDragMove.current = true;
            }
          }
        }}
        onDragEnd={() => {
          // do NOT reset x/y — card stays where dropped
        }}
        whileDrag={{ scale: 1.05, zIndex: 100 }}
        onClick={() => {
          if (!wasDragMove.current) {
            setIsExpanded(true);
          }
        }}
        data-ocid={`research.placeholder.card.${index + 1}`}
        style={{
          position: "absolute",
          left: startX,
          top: startY,
          width: card.width,
          x,
          y,
          zIndex: isHovered ? 60 : 10 + index,
          cursor: "grab",
          willChange: "transform",
          userSelect: "none",
          touchAction: "none",
        }}
        animate={
          hasDragged
            ? // After first drag: only static rotation (no drift — prevents snap-back)
              { rotate: baseRotate, scale: isHovered ? 1.03 : 1 }
            : isHovered
              ? { scale: 1.03, rotate: baseRotate }
              : {
                  x: [-driftX, driftX, -driftX],
                  y: [-driftY, driftY * 0.6, -driftY],
                  rotate: [baseRotate, baseRotate + rotDrift, baseRotate],
                }
        }
        transition={
          hasDragged || isHovered
            ? { duration: 0.3, ease: "easeOut" }
            : {
                duration: driftDuration,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                delay: index * 0.5,
              }
        }
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div
          style={{
            background: "rgba(12,12,12,0.92)",
            border: isHovered
              ? "1px solid rgba(140,58,58,0.35)"
              : "1px solid rgba(229,224,216,0.06)",
            borderRadius: "0",
            padding: "1.25rem",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            boxShadow: isHovered
              ? "0 0 28px 4px rgba(140,58,58,0.4)"
              : "0 4px 20px rgba(0,0,0,0.6)",
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              width: "28px",
              height: "2px",
              background: card.accentColor,
              marginBottom: "0.85rem",
            }}
          />

          {/* Title */}
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: "italic",
              fontSize: "12px",
              lineHeight: 1.4,
              color: "#E5E0D8",
              margin: "0 0 0.6rem",
              letterSpacing: "0.01em",
            }}
          >
            {card.title}
          </p>

          {/* Body */}
          <p
            style={{
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "9.5px",
              lineHeight: 1.75,
              color: "rgba(229,224,216,0.45)",
              margin: 0,
            }}
          >
            {card.body}
          </p>

          {/* Click hint — always visible on placeholder */}
          <p
            style={{
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "8px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(140,58,58,0.5)",
              margin: "0.7rem 0 0",
            }}
          >
            click to expand
          </p>
        </div>
      </motion.div>

      {/* Expanded full-screen overlay */}
      <AnimatePresence>
        {isExpanded && (
          <ExpandedOverlay
            title={card.title}
            description={card.body}
            onClose={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Research Page ────────────────────────────────────────────────────────────
export function Research() {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [containerSize, setContainerSize] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  });
  const [isNavMobile, setIsNavMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );

  // Confirmation overlay state — user must click "Enter Canvas" first
  const [hasEntered, setHasEntered] = useState(false);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);

  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [backendLoaded, setBackendLoaded] = useState(false);

  // Start ambient audio on mount (browser may block autoplay until interaction)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Autoplay blocked — will retry on user interaction (Enter Canvas click)
    });
  }, []);

  // Measure container and respond to resize
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        });
      }
      setIsNavMobile(window.innerWidth < 640);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Fetch research items from Motoko backend
  useEffect(() => {
    let mounted = true;
    getBackend()
      .then((backend) => backend.listLiveResearchItems())
      .then((items) => {
        if (mounted) {
          setResearchItems(items);
          setBackendLoaded(true);
        }
      })
      .catch(() => {
        if (mounted) setBackendLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Show placeholders only after backend has responded and returned no items
  const showPlaceholders = backendLoaded && researchItems.length === 0;
  const showItems = researchItems.length > 0;

  return (
    <div
      data-ocid="research.page"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000000",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      <CursorReset />

      {/* Dot-grid background texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(229,224,216,0.055) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Vignette overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Noise grain */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.025,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Fixed UI layer (z-index 100) — ALWAYS on top ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        {/* Anthropocene anchor — top left */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: "2rem",
            left: "2rem",
            pointerEvents: "auto",
          }}
        >
          <Link
            to="/"
            data-ocid="research.back.link"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "clamp(12px, 1.2vw, 15px)",
              color: "#E5E0D8",
              textDecoration: "none",
              letterSpacing: "0.02em",
              transition: "color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#8C3A3A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#E5E0D8";
            }}
          >
            Anthropocene
          </Link>
        </motion.div>

        {/* Top-right nav menu — hidden on small mobile to prevent overflow */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          aria-label="Site navigation"
          style={{
            position: "fixed",
            top: "2rem",
            right: "2rem",
            display: isNavMobile ? "none" : "flex",
            alignItems: "center",
            gap: "1.75rem",
            pointerEvents: "auto",
          }}
        >
          {[
            { label: "Art Practice", to: "/art-practice" },
            { label: "Lectures", to: "/faculty/lectures" },
            { label: "Student Work", to: "/faculty/students-works" },
          ].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              data-ocid={"research.nav.link"}
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.5)",
                textDecoration: "none",
                transition: "color 0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(229,224,216,1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(229,224,216,0.5)";
              }}
            >
              {label}
            </Link>
          ))}
        </motion.nav>
      </div>

      {/* ── Ambient forest audio — persists across overlay/canvas ── */}
      {/* biome-ignore lint/a11y/useMediaCaption: ambient background sound, no dialogue */}
      <audio
        ref={audioRef}
        src="https://res.cloudinary.com/dvmvka9ll/video/upload/v1772701104/eryliaa-forest-birds-with-wind-and-crickets-445147_pvopc9.mp3"
        loop
        preload="auto"
      />

      {/* Mute/unmute toggle — fixed bottom-right, always visible */}
      <button
        type="button"
        data-ocid="research.toggle"
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.muted = !isMuted;
          }
          setIsMuted((prev) => !prev);
        }}
        title={isMuted ? "Unmute" : "Mute"}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 120,
          background: "rgba(10,10,10,0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(229,224,216,0.1)",
          borderRadius: "9999px",
          padding: "0.5rem",
          cursor: "default",
          color: "#E5E0D8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(140,58,58,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(10,10,10,0.6)";
        }}
      >
        {isMuted ? (
          <VolumeX size={14} strokeWidth={1.5} />
        ) : (
          <Volume2 size={14} strokeWidth={1.5} />
        )}
      </button>

      {/* ── Confirmation overlay ── */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              backgroundColor: "#000000",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.25rem",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            {/* Background image skeleton — shown while image loads */}
            {!bgImageLoaded && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "#0a0a0a",
                  animation: "pulse 2s ease-in-out infinite",
                  zIndex: 0,
                }}
              />
            )}
            {/* Background image — sketchbook texture, full opacity, Cloudinary-optimized */}
            <img
              src="https://res.cloudinary.com/dvmvka9ll/image/upload/q_auto,f_auto,w_1920/v1772701097/npm_vnylxz.jpg"
              aria-hidden="true"
              alt=""
              draggable={false}
              onLoad={() => setBgImageLoaded(true)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: bgImageLoaded ? 1 : 0,
                transition: "opacity 0.8s ease",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 0,
              }}
            />

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: "clamp(32px, 6vw, 72px)",
                color: "#E5E0D8",
                margin: 0,
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
                position: "relative",
                zIndex: 1,
              }}
            >
              Research Canvas
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "clamp(10px, 1.1vw, 12px)",
                letterSpacing: "0.2em",
                color: "rgba(229,224,216,0.35)",
                margin: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              {"// thoughts in motion"}
            </motion.p>

            <motion.button
              data-ocid="research.confirm_button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              onClick={() => {
                setHasEntered(true);
                // Resume audio after user interaction (browser autoplay policy)
                if (audioRef.current) {
                  audioRef.current.play().catch(() => {});
                }
              }}
              whileHover={{ backgroundColor: "#a04444" }}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 2.5rem",
                backgroundColor: "#8C3A3A",
                color: "#E5E0D8",
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                border: "none",
                borderRadius: "0",
                cursor: "pointer",
                position: "relative",
                zIndex: 1,
                transition: "background-color 0.2s ease",
              }}
            >
              Enter Canvas
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating canvas (z-index 10) ── */}
      <div
        ref={containerRef}
        data-ocid="research.canvas_target"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* Loading indicator — shown while waiting for backend response */}
        {!backendLoaded && (
          <motion.div
            data-ocid="research.loading_state"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "40px",
              height: "2px",
              background: "rgba(140,58,58,0.6)",
              pointerEvents: "none",
              zIndex: 20,
            }}
          />
        )}

        {/* Motoko backend image cards */}
        {showItems &&
          researchItems.map((item, index) => (
            <ImageCard
              key={item.id.toString()}
              item={item}
              index={index}
              containerW={containerSize.w}
              containerH={containerSize.h}
              containerRef={containerRef}
            />
          ))}

        {/* Instructional placeholder cards when backend is empty */}
        {showPlaceholders &&
          INSTRUCTIONAL_PLACEHOLDERS.map((card, index) => (
            <PlaceholderCard
              key={card.id}
              card={card}
              index={index}
              containerW={containerSize.w}
              containerH={containerSize.h}
              containerRef={containerRef}
            />
          ))}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 110,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
            fontSize: "8px",
            letterSpacing: "0.15em",
            color: "rgba(229,224,216,0.1)",
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
              color: "rgba(229,224,216,0.18)",
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
