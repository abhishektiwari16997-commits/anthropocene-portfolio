import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ArtPortfolioItem } from "../backend.d";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { useCursor } from "../context/CursorContext";
import { getBackend } from "../utils/getBackend";

// ─── Assets ──────────────────────────────────────────────────────────────────
const galleryAudio = "/assets/oceanframemusic-romantic-video-483626.mp3";

// ─── Artist Statement Text ────────────────────────────────────────────────────

const PARAGRAPH_1 =
  "When asked where I belong, I have no simple answer. I was born in Uttar Pradesh, have deep ties to Chandigarh, and now live in Mukkam, Kerala, where I am often viewed as a \u201cNorth Indian\u201d outsider. My practice is rooted in this persistent state of in-betweenness\u2014the everyday ache of missing home while migrating to build independence. This personal sense of displacement mirrors the physical destruction happening in my immediate surroundings, where the natural landscape is being violently reshaped by illegal stone quarries. Deeply inspired by Andreas Huyssen\u2019s writings in Present Pasts on how we construct memory and space, my work exists at the intersection of human migration and the ecological shifting of the earth. I navigate these themes by taking on the persona of the \u201cAnthropocene,\u201d conducting body-based performances and hosting open discussions with local residents and migrant workers. My practice is highly participatory; the memories, phrases, and thoughts shared by the community become the very foundation of my art.";

const PARAGRAPH_2 =
  "Through an interdisciplinary approach of oil painting, printmaking, and performance, I translate these fragile conversations into tangible forms, as seen in the works submitted for this application. One piece juxtaposes my childhood memories of playing stapu on quiet, community-owned roads with today\u2019s hyper-capitalist reality in the Malappuram hills, where remote forest roads are engineered solely for heavy quarry trucks. Another work grounds this ecological violence in intimate human experience, highlighting a migrant quarry worker who spends his solitary Sundays buying weekly groceries, deeply missing his young daughter, Pari, back home. The submitted oil paintings, executed in an impressionistic style to capture the fleeting nature of memory, carry titles that are direct quotes from the people I speak with. Phrases like \u201cAre we drilling into the mountain, or just ourselves?\u201d, \u201cMaking a house by breaking a home,\u201d \u201cThere is no shoulder where I can rest my head,\u201d and \u201cMy village is still here,\u201d reflect the shared heartbreak of my surroundings. Together, these works question our shifting societal priorities and what it means to belong to a place that is constantly being erased.";

// ─── Components ───────────────────────────────────────────────────────────────

function WordSplit({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.28em",
            position: "relative",
            cursor: "default",
            lineHeight: 1.85,
          }}
          whileHover={{ scale: 1.05, zIndex: 10 }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

function ArtistStatement() {
  return (
    <section
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
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.3 }}
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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(20,20,20,0.95)",
          border: "1px solid rgba(140,58,58,0.2)",
          padding: "clamp(2.5rem, 5vw, 5rem)",
          maxWidth: "860px",
          width: "90vw",
          position: "relative",
          zIndex: 2,
        }}
      >
        <h2 style={{ color: "rgba(140,58,58,0.8)", letterSpacing: "0.35em", fontSize: "12px", textTransform: "uppercase", marginBottom: "1.2rem" }}>
          Artist Statement
        </h2>
        <p style={{ color: "rgba(229,224,216,0.82)", lineHeight: 1.85, fontSize: "16px" }}>
          <WordSplit text={PARAGRAPH_1} />
        </p>
        <p style={{ color: "rgba(229,224,216,0.82)", lineHeight: 1.85, fontSize: "16px", marginTop: "1.6rem" }}>
          <WordSplit text={PARAGRAPH_2} />
        </p>
      </motion.div>
    </section>
  );
}

function GalleryItem({ item, index }: { item: ArtPortfolioItem; index: number }) {
  const isEven = index % 2 === 0;
  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000" }}>
      <div style={{ display: "flex", flexDirection: isEven ? "row" : "row-reverse", alignItems: "center", gap: "2rem", width: "90vw" }}>
        <img src={item.imagePath} alt={item.title} style={{ maxWidth: "70%", maxHeight: "80vh", objectFit: "contain" }} />
        <div style={{ color: "white" }}>
          <p style={{ opacity: 0.5 }}>{String(index + 1).padStart(2, "0")}</p>
          <h3>{item.title}</h3>
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function ArtPractice() {
  const { setSuppressDefaultLabel } = useCursor();
  const [artworks, setArtworks] = useState<ArtPortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setSuppressDefaultLabel(true);
    return () => setSuppressDefaultLabel(false);
  }, [setSuppressDefaultLabel]);

  useEffect(() => {
    getBackend()
      .then((b) => b.listLiveArtItems())
      .then((items) => setArtworks(items))
      .catch(() => setArtworks([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(audioRef.current.muted);
    if (!audioRef.current.muted) audioRef.current.play();
  };

  return (
    <div style={{ background: "#000000", minHeight: "100vh", overflowX: "hidden" }}>
      <audio ref={audioRef} src={galleryAudio} loop preload="auto" />
      
      {/* Navigation */}
      <div style={{ position: "fixed", top: "2rem", left: "2rem", zIndex: 100 }}>
        <AnthropoceneAnchor />
      </div>

      <div style={{ position: "fixed", top: "2rem", right: "2rem", zIndex: 100, display: "flex", gap: "1.5rem" }}>
        <Link to="/art-practice" style={{ color: "white", textDecoration: "none", fontSize: "10px" }}>ART PRACTICE</Link>
        <Link to="/faculty/lectures" style={{ color: "white", textDecoration: "none", fontSize: "10px" }}>LECTURES</Link>
      </div>

      <ArtistStatement />

      {!isLoading && artworks.map((item, i) => (
        <GalleryItem key={item.id} item={item} index={i} />
      ))}

      {/* Mute Button */}
      <button 
        onClick={handleToggleMute}
        style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 100, background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid white", borderRadius: "50%", width: "40px", height: "40px" }}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}
