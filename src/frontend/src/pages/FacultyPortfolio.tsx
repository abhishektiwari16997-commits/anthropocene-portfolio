import { FileText, Maximize2, Minimize2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { FacultySubNav } from "../components/FacultySubNav";
import { getBackend } from "../utils/getBackend";

// ─── Professional Narrative Card ──────────────────────────────────────────────

const DEFAULT_NARRATIVE =
  "I am a multidisciplinary design educator and art practitioner working across printmaking, interaction design, and ecological performance. Currently, I serve as an Assistant Professor of Interaction Design at KMCT School of Design, Kerala, where I teach UX research and UI fundamentals. Previously, I was the Design Head at PrepLadder (Unacademy), leading a creative team of 16 in illustration and animation. I hold a Master of Fine Arts and a Bachelor of Fine Arts in Printmaking and Design from the Government College of Art, Chandigarh. My practice is recognized internationally, supported by a Venice Biennale Travel Grant and a MAIR Residency Fellowship in 2024. I specialize in bridging traditional mediums like Etching and Pottery with digital mastery in Figma and the Adobe Creative Suite.";

function NarrativeWordSplit({ text }: { text: string }) {
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
            lineHeight: 1.85,
            position: "relative",
            cursor: "default",
            color: "rgba(229,224,216,0.82)",
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

// ─── Professional Narrative Card ──────────────────────────────────────────────

function ProfessionalNarrativeCard() {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBackend()
      .then((b) => b.getProfessionalNarrative())
      .then((text) => {
        setNarrative(text?.trim() ? text : DEFAULT_NARRATIVE);
      })
      .catch(() => {
        setNarrative(DEFAULT_NARRATIVE);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <motion.div
        data-ocid="portfolio.narrative.card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "#000000",
          border: "1px solid rgba(140,58,58,0.15)",
          padding: "clamp(2rem, 4vw, 4rem)",
          marginBottom: "4rem",
          position: "relative",
        }}
      >
        {/* Heading */}
        <p
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "10px",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            fontVariant: "small-caps",
            color: "rgba(229,224,216,0.5)",
            margin: "0 0 1rem 0",
            fontWeight: 400,
          }}
        >
          Professional Narrative
        </p>

        {/* Rule */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "rgba(140,58,58,0.2)",
            marginBottom: "1.8rem",
          }}
        />

        {/* Body */}
        {isLoading ? (
          <div
            data-ocid="portfolio.narrative.loading_state"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            {[100, 85, 92, 78].map((w, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                key={i}
                style={{
                  height: "14px",
                  width: `${w}%`,
                  background: "rgba(229,224,216,0.04)",
                  borderRadius: "1px",
                }}
              />
            ))}
          </div>
        ) : (
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: "clamp(13px, 1.1vw, 15px)",
              color: "rgba(229,224,216,0.82)",
              lineHeight: 1.85,
              margin: 0,
              letterSpacing: "0.01em",
            }}
          >
            <NarrativeWordSplit text={narrative ?? DEFAULT_NARRATIVE} />
          </p>
        )}
      </motion.div>
    </>
  );
}

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

// Cycle of card background colors — same as original design
const CARD_COLORS = [
  "#1A1410",
  "#0F1418",
  "#1C1410",
  "#141414",
  "#18141A",
  "#121A14",
  "#14181A",
  "#1A1A1C",
];

interface PortfolioItemDisplay {
  id: string;
  title: string;
  client: string;
  year: string;
  tags: string[];
  color: string;
  figmaUrl: string;
  imageData: string;
  videoUrl: string;
  description: string;
  pdfData: string;
}

// ─── Portfolio Item PDF Modal ──────────────────────────────────────────────────

function PortfolioPDFModal({
  pdfData,
  title,
  onClose,
}: {
  pdfData: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      data-ocid="portfolio.pdf.modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header bar — close button lives here, never overlapped by embed */}
      <div
        style={{
          height: "48px",
          background: "rgba(0,0,0,0.98)",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0 1.5rem",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-ocid="portfolio.pdf.close_button"
          onClick={onClose}
          aria-label="Close PDF overlay"
          style={{
            background: "none",
            border: "none",
            padding: "0.4rem",
            cursor: "default",
            color: "rgba(229,224,216,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 0,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#8C3A3A";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(229,224,216,0.7)";
          }}
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      <embed
        src={pdfData}
        type="application/pdf"
        title={`${title} — PDF`}
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          display: "block",
        }}
      />
    </motion.div>
  );
}

interface PortfolioCardProps {
  item: PortfolioItemDisplay;
  index: number;
}

// ─── Media renderer — picks the right element based on what's populated ───────

function PortfolioMediaZone({
  figmaUrl,
  imageData,
  videoUrl,
  title,
}: {
  figmaUrl: string;
  imageData: string;
  videoUrl: string;
  title: string;
}) {
  if (figmaUrl) {
    const src = figmaUrl.includes("hide_ui=1")
      ? figmaUrl
      : `${figmaUrl}${figmaUrl.includes("?") ? "&" : "?"}hide_ui=1`;
    return (
      <iframe
        src={src}
        title={`${title} — Prototype`}
        allowFullScreen
        style={{
          width: "100%",
          height: "100%",
          minHeight: "240px",
          border: "none",
          display: "block",
          background: "#0a0a0a",
        }}
      />
    );
  }
  if (imageData) {
    return (
      <img
        src={imageData}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "200px",
          objectFit: "contain",
          display: "block",
        }}
      />
    );
  }
  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        aria-label={`${title} — design portfolio video`}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "200px",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }
  return null;
}

function PortfolioCard({ item, index }: PortfolioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [isPDFButtonHovered, setIsPDFButtonHovered] = useState(false);
  const hasMedia = !!(item.figmaUrl || item.imageData || item.videoUrl);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <motion.div
      data-ocid={`portfolio.card.item.${index + 1}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.08 * index,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        backgroundColor: item.color,
        border: "1px solid rgba(229,224,216,0.06)",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        minHeight: "320px",
      }}
    >
      {/* Card header — title, client, year, tags */}
      <div
        style={{
          padding: "1.5rem 1.5rem 1rem",
          borderBottom: "1px solid rgba(229,224,216,0.05)",
        }}
      >
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "clamp(17px, 1.8vw, 22px)",
            color: "#E5E0D8",
            margin: "0 0 0.3rem",
            lineHeight: 1.2,
          }}
        >
          {item.title}
        </p>
        <p
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "11px",
            color: "rgba(229,224,216,0.4)",
            margin: "0 0 0.6rem",
          }}
        >
          {item.client} — {item.year}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {item.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "9px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.28)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Split body — only when media is present */}
      {hasMedia && (
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            minHeight: isMobile ? "auto" : "260px",
          }}
        >
          {/* Left — media zone (65% → 100% when expanded, always 100% on mobile) */}
          <motion.div
            animate={
              isMobile
                ? { width: "100%" }
                : { width: isExpanded ? "100%" : "65%" }
            }
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
              background: "#0a0a0a",
              minHeight: isMobile ? "220px" : "260px",
            }}
          >
            {/* Expand/collapse toggle — top right of media zone */}
            <button
              type="button"
              data-ocid={`portfolio.card.toggle.${index + 1}`}
              onClick={() => setIsExpanded((prev) => !prev)}
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                zIndex: 10,
                background: "rgba(10,10,10,0.6)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "none",
                borderRadius: "9999px",
                padding: "0.4rem",
                color: "#E5E0D8",
                cursor: "default",
                lineHeight: 0,
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#8C3A3A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(10,10,10,0.6)";
              }}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <Minimize2 size={13} strokeWidth={1.5} />
              ) : (
                <Maximize2 size={13} strokeWidth={1.5} />
              )}
            </button>

            <PortfolioMediaZone
              figmaUrl={item.figmaUrl}
              imageData={item.imageData}
              videoUrl={item.videoUrl}
              title={item.title}
            />
          </motion.div>

          {/* Right — description zone (35% → 0% on desktop when expanded; full width below on mobile) */}
          <motion.div
            animate={
              isMobile
                ? { width: "100%", opacity: 1 }
                : {
                    width: isExpanded ? "0%" : "35%",
                    opacity: isExpanded ? 0 : 1,
                  }
            }
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{
              overflow: "hidden",
              flexShrink: 0,
              background: "#8C3A3A",
              minHeight: isMobile ? "auto" : "260px",
              padding: isMobile ? "1.25rem" : isExpanded ? "0" : "1.5rem",
            }}
          >
            {item.description && (
              <p
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: "clamp(12px, 1vw, 14px)",
                  color: "#E5E0D8",
                  lineHeight: 1.8,
                  margin: 0,
                  opacity: 0.92,
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.description}
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* If no media but has description — show description below header */}
      {!hasMedia && item.description && (
        <div style={{ padding: "1.25rem 1.5rem", background: "#8C3A3A" }}>
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: "clamp(12px, 1vw, 14px)",
              color: "#E5E0D8",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {item.description}
          </p>
        </div>
      )}

      {/* PDF button footer — shown when pdfData is available */}
      {item.pdfData && (
        <div
          style={{
            padding: "0.85rem 1.5rem",
            borderTop: "1px solid rgba(229,224,216,0.05)",
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <button
            type="button"
            data-ocid={`portfolio.card.item.${index + 1}.pdf.open_modal_button`}
            onClick={() => setShowPDFModal(true)}
            onMouseEnter={() => setIsPDFButtonHovered(true)}
            onMouseLeave={() => setIsPDFButtonHovered(false)}
            style={{
              background: "none",
              border: `1px solid ${isPDFButtonHovered ? "rgba(229,224,216,0.75)" : "rgba(229,224,216,0.28)"}`,
              padding: "0.4rem 0.9rem",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "8px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#E5E0D8",
              cursor: "default",
              borderRadius: "0",
              transition: "border-color 0.25s ease, box-shadow 0.25s ease",
              boxShadow: isPDFButtonHovered
                ? "0 0 8px rgba(229,224,216,0.08)"
                : "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <FileText size={11} strokeWidth={1.5} />
            View PDF
          </button>
        </div>
      )}

      {/* PDF Modal */}
      <AnimatePresence>
        {showPDFModal && (
          <PortfolioPDFModal
            pdfData={item.pdfData}
            title={item.title}
            onClose={() => setShowPDFModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FacultyPortfolio() {
  const [items, setItems] = useState<PortfolioItemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBackend()
      .then((b) => b.listLiveDesignPortfolio())
      .then((data) => {
        const mapped: PortfolioItemDisplay[] = data.map((item, i) => ({
          id: String(item.id),
          title: item.title,
          client: item.client,
          year: item.year,
          tags: item.tags,
          color: CARD_COLORS[i % CARD_COLORS.length],
          figmaUrl: item.figmaUrl ?? "",
          imageData: item.imageData ?? "",
          videoUrl: item.videoUrl ?? "",
          description: item.description ?? "",
          pdfData: item.pdfData ?? "",
        }));
        setItems(mapped);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div
      data-ocid="portfolio.page"
      style={{
        minHeight: "100dvh",
        backgroundColor: "#080808",
        cursor: "none",
        position: "relative",
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

      {/* Anchor */}
      <AnthropoceneAnchor />

      {/* Sub-nav */}
      <FacultySubNav />

      {/* Main content */}
      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "clamp(1rem, 4vw, 2.5rem) clamp(0.75rem, 2vw, 2rem) 6rem",
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: "3.5rem" }}
        >
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "10px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(229,224,216,0.3)",
              marginBottom: "0.75rem",
            }}
          >
            Curated Works — 2022–2024
          </p>
          <h1
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 800,
              fontSize: "clamp(32px, 4.5vw, 64px)",
              color: "#E5E0D8",
              margin: 0,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Design Portfolio
          </h1>
        </motion.div>

        {/* Professional Narrative */}
        <ProfessionalNarrativeCard />

        {/* Loading state */}
        {isLoading && (
          <motion.div
            data-ocid="portfolio.loading_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
              gap: "1.5rem",
            }}
          >
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                style={{
                  height: "280px",
                  background: "rgba(229,224,216,0.03)",
                  borderRadius: "2px",
                  border: "1px solid rgba(229,224,216,0.05)",
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <motion.div
            data-ocid="portfolio.empty_state"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ padding: "6rem 0", textAlign: "center" }}
          >
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.2)",
                margin: 0,
              }}
            >
              No portfolio items published yet
            </p>
          </motion.div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <div
            data-ocid="portfolio.card.list"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
              gap: "1.5rem",
            }}
          >
            {items.map((item, i) => (
              <PortfolioCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
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
            color: "rgba(229,224,216,0.18)",
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
