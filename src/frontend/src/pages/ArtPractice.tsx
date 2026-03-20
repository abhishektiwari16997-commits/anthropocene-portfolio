import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ArtPortfolioItem } from "../backend.d";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { useCursor } from "../context/CursorContext";
import { getBackend } from "../utils/getBackend";

const music = "/assets/oceanframemusic-romantic-video-483626.mp3";

// ─── Artist Statement Text ────────────────────────────────────────────────────

const PARAGRAPH_1 =
  "When asked where I belong, I have no simple answer. I was born in Uttar Pradesh, have deep ties to Chandigarh, and now live in Mukkam, Kerala, where I am often viewed as a \u201cNorth Indian\u201d outsider. My practice is rooted in this persistent state of in-betweenness\u2014the everyday ache of missing home while migrating to build independence. This personal sense of displacement mirrors the physical destruction happening in my immediate surroundings, where the natural landscape is being violently reshaped by illegal stone quarries. Deeply inspired by Andreas Huyssen\u2019s writings in Present Pasts on how we construct memory and space, my work exists at the intersection of human migration and the ecological shifting of the earth. I navigate these themes by taking on the persona of the \u201cAnthropocene,\u201d conducting body-based performances and hosting open discussions with local residents and migrant workers. My practice is highly participatory; the memories, phrases, and thoughts shared by the community become the very foundation of my art.";

const PARAGRAPH_2 =
  "Through an interdisciplinary approach of oil painting, printmaking, and performance, I translate these fragile conversations into tangible forms, as seen in the works submitted for this application. One piece juxtaposes my childhood memories of playing stapu on quiet, community-owned roads with today\u2019s hyper-capitalist reality in the Malappuram hills, where remote forest roads are engineered solely for heavy quarry trucks. Another work grounds this ecological violence in intimate human experience, highlighting a migrant quarry worker who spends his solitary Sundays buying weekly groceries, deeply missing his young daughter, Pari, back home. The submitted oil paintings, executed in an impressionistic style to capture the fleeting nature of memory, carry titles that are direct quotes from the people I speak with. Phrases like \u201cAre we drilling into the mountain, or just ourselves?\u201d, \u201cMaking a house by breaking a home,\u201d \u201cThere is no shoulder where I can rest my head,\u201d and \u201cMy village is still here,\u201d reflect the shared heartbreak of my surroundings. Together, these works question our shifting societal priorities and what it means to belong to a place that is constantly being erased.";

// ─── WordSplit: word-by-word hover spans ──────────────────────────────────────

function WordSplit({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: static text, order never changes
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.28em",
            position: "relative",
            cursor: "default",
            lineHeight: 1.85,
          }}
          whileHover={{ scale: 1.05, zIndex: 10 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 28,
            duration: 0.4,
          }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

// ─── Artist Statement Section ─────────────────────────────────────────────────

function ArtistStatement() {
  return (
    <section
      data-ocid="art.statement.section"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        overflow: "hidden",
        padding: "7rem 0 5rem",
      }}
    >
      {/* Top rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          top: "5rem",
          left: "clamp(2rem, 8vw, 8rem)",
          right: "clamp(2rem, 8vw, 8rem)",
          height: "1px",
          background: "rgba(140,58,58,0.3)",
          transformOrigin: "left",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "rgba(20,20,20,0.95)",
          border: "1px solid rgba(140,58,58,0.2)",
          padding: "clamp(2.5rem, 5vw, 5rem)",
          maxWidth: "860px",
          width: "90vw",
          boxShadow: "0 0 80px rgba(140,58,58,0.06)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Heading */}
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(11px, 1vw, 13px)",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(140,58,58,0.8)",
            margin: "0 0 1.2rem 0",
            fontWeight: 400,
          }}
        >
          Artist Statement
        </h2>

        {/* Rule below heading */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "rgba(140,58,58,0.25)",
            marginBottom: "2rem",
          }}
        />

        {/* Paragraph 1 */}
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(13px, 1.15vw, 16px)",
            color: "rgba(229,224,216,0.82)",
            lineHeight: 1.85,
            margin: "0 0 1.6rem 0",
            letterSpacing: "0.01em",
          }}
        >
          <WordSplit text={PARAGRAPH_1} />
        </p>

        {/* Paragraph 2 */}
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(13px, 1.15vw, 16px)",
            color: "rgba(229,224,216,0.82)",
            lineHeight: 1.85,
            margin: 0,
            letterSpacing: "0.01em",
          }}
        >
          <WordSplit text={PARAGRAPH_2} />
        </p>
      </motion.div>

      {/* Bottom rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          bottom: "5rem",
          left: "clamp(2rem, 8vw, 8rem)",
          right: "clamp(2rem, 8vw, 8rem)",
          height: "1px",
          background: "rgba(140,58,58,0.3)",
          transformOrigin: "left",
        }}
      />

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 2.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "8px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(229,224,216,0.2)",
          }}
        >
          Works
        </span>
        <div
          style={{
            width: "1px",
            height: "28px",
            background:
              "linear-gradient(to bottom, rgba(229,224,216,0.2), transparent)",
          }}
        />
      </motion.div>
    </section>
  );
}

// ─── Gallery Image Section ────────────────────────────────────────────────────

interface GalleryItemProps {
  item: ArtPortfolioItem;
  index: number;
}

function GalleryItem({ item, index }: GalleryItemProps) {
  const isEven = index % 2 === 0;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "2.5rem 0" : "4rem 0",
        background: "#000000",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : isEven ? "row" : "row-reverse",
          alignItems: isMobile ? "flex-start" : "center",
          gap: "2rem",
          width: "90vw",
          maxWidth: "1400px",
        }}
      >
        {/* Image Container — full width on mobile, flex-1 on desktop */}
        <motion.div
          style={{
            flex: "1 1 auto",
            maxWidth: isMobile ? "100%" : "75vw",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          whileHover={{ scale: 1.015 }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <img
            src={item.imagePath}
            alt={item.title}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: isMobile ? "70vh" : "90vh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </motion.div>

        {/* Title Panel — below image on mobile, side panel on desktop */}
        <div
          style={{
            width: isMobile ? "100%" : "25%",
            flexShrink: 0,
            textAlign: "left",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "9px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(229,224,216,0.35)",
              marginBottom: "8px",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            style={{
              display: "block",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(14px, 1.4vw, 20px)",
              fontWeight: 400,
              color: "rgba(229,224,216,0.85)",
              lineHeight: 1.4,
            }}
          >
            {item.title}
          </span>
          <div
            style={{
              display: "inline-block",
              width: "32px",
              height: "1px",
              background: "rgba(140,58,58,0.7)",
              marginTop: "8px",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Empty Gallery Placeholder ────────────────────────────────────────────────

function EmptyGalleryPlaceholder({ index }: { index: number }) {
  return (
    <section
      data-ocid="art.empty_state"
      style={{
        minHeight: "80vh",
        width: "100%",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: index * 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontStyle: "italic",
          fontSize: "11px",
          letterSpacing: "0.2em",
          color: "rgba(229,224,216,0.2)",
          textAlign: "center",
          margin: 0,
        }}
      >
        Upload artworks from admin dashboard
      </motion.p>
    </section>
  );
}

// ─── Mute / Unmute button ─────────────────────────────────────────────────────

interface AudioButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

function AudioButton({ isMuted, onToggle }: AudioButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      data-ocid="art.toggle"
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={isMuted ? "Unmute gallery music" : "Mute gallery music"}
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 60,
        background: "rgba(20,20,20,0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `1px solid ${isHovered ? "rgba(140,58,58,0.5)" : "rgba(229,224,216,0.1)"}`,
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "none",
        transition: "border-color 0.25s ease",
      }}
    >
      {isMuted ? (
        /* Speaker muted icon */
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isHovered ? "rgba(140,58,58,0.9)" : "rgba(229,224,216,0.5)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        /* Speaker playing icon */
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isHovered ? "rgba(140,58,58,0.9)" : "rgba(229,224,216,0.5)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}

// ─── ArtPractice page ─────────────────────────────────────────────────────────

export function ArtPractice() {
  const { setSuppressDefaultLabel } = useCursor();
  const [artworks, setArtworks] = useState<ArtPortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasStartedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNavMobile, setIsNavMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    const check = () => setIsNavMobile(window.innerWidth < 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Suppress default cursor label on this page
  useEffect(() => {
    setSuppressDefaultLabel(true);
    return () => setSuppressDefaultLabel(false);
  }, [setSuppressDefaultLabel]);

  // Smooth scroll — CSS-based geological momentum feel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.scrollBehavior = "smooth";
    return () => {
      if (el) el.style.scrollBehavior = "";
    };
  }, []);

  // Fetch live artworks from backend
  useEffect(() => {
    getBackend()
      .then((b) => b.listLiveArtItems())
      .then((items) => setArtworks(items))
      .catch(() => setArtworks([]))
      .finally(() => setIsLoading(false));
  }, []);

  // Audio: autoplay attempt + fallback on first interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Gallery volume — atmospheric but audible
    audio.volume = 0.09;

    const tryPlay = () => {
      if (hasStartedRef.current) return;
      audio
        .play()
        .then(() => {
          hasStartedRef.current = true;
        })
        .catch(() => {
          // autoplay blocked — wait for user interaction
        });
    };

    const onInteraction = () => {
      if (hasStartedRef.current) return;
      audio
        .play()
        .then(() => {
          hasStartedRef.current = true;
        })
        .catch(() => {});
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
      document.removeEventListener("keydown", onInteraction);
    };

    tryPlay();
    document.addEventListener("click", onInteraction);
    document.addEventListener("touchstart", onInteraction);
    document.addEventListener("keydown", onInteraction);

    return () => {
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
      document.removeEventListener("keydown", onInteraction);
    };
  }, []);

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
    // If unmuting but play never started, start now
    if (!audio.muted && !hasStartedRef.current) {
      audio
        .play()
        .then(() => {
          hasStartedRef.current = true;
        })
        .catch(() => {});
    }
  };

  const showEmpty = !isLoading && artworks.length === 0;
  const placeholders = [0, 1, 2];

  return (
    <div
      ref={containerRef}
      data-ocid="art.page"
      style={{
        position: "relative",
        background: "#000000",
        cursor: "none",
        overflowY: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(140,58,58,0.15) transparent",
      }}
    >
      {/* ── Ambient audio (hidden) ── */}
      {/* biome-ignore lint/a11y/useMediaCaption: ambient instrumental music, no dialogue */}
      <audio
        ref={audioRef}
        src={galleryAudio}
        loop
        preload="auto"
        style={{ display: "none" }}
      />

      {/* ── Fixed Navigation Overlay ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        {/* Top-left: Anthropocene anchor */}
        <div style={{ pointerEvents: "auto" }}>
          <AnthropoceneAnchor />
        </div>

        {/* Top-right: Nav links — hidden on small mobile to prevent overflow */}
        <div
          style={{
            position: "fixed",
            top: "2rem",
            right: "2rem",
            display: isNavMobile ? "none" : "flex",
            gap: "2rem",
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          {[
            { label: "Art Practice", to: "/art-practice" },
            { label: "Lectures", to: "/faculty/lectures" },
            { label: "Student Work", to: "/faculty/students-works" },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={
                to as
                  | "/art-practice"
                  | "/faculty/lectures"
                  | "/faculty/students-works"
              }
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.75)",
                textDecoration: "none",
                cursor: "none",
                transition: "color 0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#8C3A3A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(229,224,216,0.75)";
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Artist Statement (first section) ── */}
      <ArtistStatement />

      {/* ── Gallery sections or loading/empty state ── */}
      {isLoading ? (
        <section
          style={{
            width: "100%",
            minHeight: "100vh",
            background: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            data-ocid="art.loading_state"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{
              width: "60px",
              height: "1px",
              background: "rgba(140,58,58,0.5)",
            }}
          />
        </section>
      ) : showEmpty ? (
        placeholders.map((i) => <EmptyGalleryPlaceholder key={i} index={i} />)
      ) : (
        artworks.map((item, i) => (
          <GalleryItem key={String(item.id)} item={item} index={i} />
        ))
      )}

      {/* ── Footer ── */}
      <div
        style={{
          padding: "3rem 0 2rem",
          background: "#000000",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "10px",
            letterSpacing: "0.15em",
            color: "rgba(229,224,216,0.18)",
            textAlign: "center",
            margin: 0,
          }}
        >
          © 2026. Abhishek Tiwari
        </p>
      </div>

      {/* ── Mute/Unmute audio button ── */}
      <AudioButton isMuted={isMuted} onToggle={handleToggleMute} />
    </div>
  );
}
