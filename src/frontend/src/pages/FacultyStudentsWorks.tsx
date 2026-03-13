import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { StudentWorkItem } from "../backend.d";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { FacultySubNav } from "../components/FacultySubNav";
import { getBackend } from "../utils/getBackend";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

// ─── PDF Viewer Modal ──────────────────────────────────────────────────────────
function PdfModal({
  pdfData,
  studentName,
  onClose,
}: {
  pdfData: string;
  studentName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      data-ocid="students.pdf.modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      {/* Close button */}
      <button
        type="button"
        data-ocid="students.pdf.close_button"
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
          color: "rgba(229,224,216,0.45)",
          fontSize: "24px",
          cursor: "pointer",
          lineHeight: 1,
          padding: "0.5rem",
          zIndex: 310,
          fontFamily: '"JetBrains Mono", monospace',
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#8C3A3A";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "rgba(229,224,216,0.45)";
        }}
        aria-label="Close PDF viewer"
      >
        ×
      </button>

      {/* Header */}
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
          fontSize: "9px",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(229,224,216,0.3)",
          marginBottom: "1rem",
          alignSelf: "flex-start",
          maxWidth: "900px",
          width: "100%",
        }}
      >
        {studentName} — Student Work PDF
      </motion.p>

      {/* PDF iframe */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "900px",
          height: "80vh",
          border: "1px solid rgba(229,224,216,0.1)",
          overflow: "hidden",
          background: "#111111",
        }}
      >
        <iframe
          src={pdfData}
          title={`${studentName} — PDF`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "#111111",
          }}
        />
      </motion.div>

      <p
        style={{
          fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
          fontSize: "8px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(229,224,216,0.15)",
          marginTop: "0.75rem",
          pointerEvents: "none",
        }}
      >
        click outside to close · esc to dismiss
      </p>
    </motion.div>
  );
}

// ─── Student Card ──────────────────────────────────────────────────────────────
function StudentCard({
  item,
  index,
}: {
  item: StudentWorkItem;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const hasPdf = !!item.pdfData?.trim();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      <motion.div
        data-ocid={`students.card.item.${index + 1}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          delay: 0.1 * index,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          background: "#0e0e0e",
          border: "1px solid rgba(229,224,216,0.06)",
          borderRadius: "2px",
          overflow: "hidden",
          minHeight: isMobile ? "auto" : "280px",
        }}
      >
        {/* ── Photo (top on mobile, left on desktop) ── */}
        <div
          style={{
            width: isMobile ? "100%" : "38%",
            height: isMobile ? "220px" : "auto",
            flexShrink: 0,
            background: "#111111",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {item.photoData ? (
            <img
              src={item.photoData}
              alt={`${item.studentName} — student work`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                minHeight: isMobile ? "220px" : "280px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(229,224,216,0.15)",
                  margin: 0,
                }}
              >
                No photo
              </p>
            </div>
          )}
        </div>

        {/* ── Info (below on mobile, right on desktop) ── */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? "1.5rem 1.25rem" : "2rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top: name + description */}
          <div>
            {/* Index tag */}
            <p
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "8px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(140,58,58,0.7)",
                margin: "0 0 0.6rem",
              }}
            >
              Student Work — {String(index + 1).padStart(2, "0")}
            </p>

            {/* Student name */}
            <h2
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: "clamp(20px, 2vw, 28px)",
                color: "#E5E0D8",
                margin: "0 0 1rem",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {item.studentName}
            </h2>

            {/* Description — collapsible if long */}
            {item.description && (
              <>
                <p
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "13px",
                    lineHeight: 1.75,
                    color: "rgba(229,224,216,0.55)",
                    margin: 0,
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: isExpanded ? "unset" : 4,
                    overflow: isExpanded ? "visible" : "hidden",
                    transition: "all 0.3s ease",
                  }}
                >
                  {item.description}
                </p>
                {item.description.length > 300 && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded((v) => !v)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0.4rem 0 0",
                      fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                      fontSize: "8px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(229,224,216,0.3)",
                      cursor: "default",
                      transition: "color 0.2s ease",
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
                    {isExpanded ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Bottom: divider + PDF button */}
          <div>
            {/* Laterite Red rule */}
            <div
              style={{
                width: "32px",
                height: "1px",
                background: "rgba(140,58,58,0.5)",
                margin: "1.5rem 0",
              }}
            />

            {hasPdf ? (
              <button
                type="button"
                data-ocid={`students.card.pdf.open_modal_button.${index + 1}`}
                onClick={() => setShowPdf(true)}
                style={{
                  background: "none",
                  border: "1px solid rgba(229,224,216,0.18)",
                  padding: "0.55rem 1.25rem",
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "rgba(229,224,216,0.55)",
                  cursor: "default",
                  borderRadius: "0",
                  transition: "border-color 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "rgba(140,58,58,0.55)";
                  el.style.color = "#E5E0D8";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "rgba(229,224,216,0.18)";
                  el.style.color = "rgba(229,224,216,0.55)";
                }}
              >
                View Prototype / PDF
              </button>
            ) : (
              <p
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(229,224,216,0.15)",
                  margin: 0,
                }}
              >
                No PDF attached
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* PDF Modal */}
      <AnimatePresence>
        {showPdf && hasPdf && (
          <PdfModal
            pdfData={item.pdfData}
            studentName={item.studentName}
            onClose={() => setShowPdf(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function FacultyStudentsWorks() {
  const [works, setWorks] = useState<StudentWorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBackend()
      .then((b) => b.listLiveStudentWorks())
      .then((items) => {
        setWorks(items);
      })
      .catch(() => {
        setWorks([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div
      data-ocid="students.page"
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
          maxWidth: "960px",
          margin: "0 auto",
          padding: "clamp(1rem, 3vw, 2.5rem) clamp(0.75rem, 2vw, 2rem) 6rem",
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
            Student Projects — Selected Works
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
            Students Works
          </h1>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <motion.div
            data-ocid="students.loading_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {[1, 2, 3].map((n) => (
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
        {!isLoading && works.length === 0 && (
          <motion.div
            data-ocid="students.empty_state"
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
              No student works published yet
            </p>
          </motion.div>
        )}

        {/* Cards — vertical stack */}
        {!isLoading && works.length > 0 && (
          <div
            data-ocid="students.card.list"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2.5rem",
            }}
          >
            {works.map((item, i) => (
              <StudentCard key={item.id.toString()} item={item} index={i} />
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
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(229,224,216,0.28)",
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
