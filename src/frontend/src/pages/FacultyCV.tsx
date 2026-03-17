import { useEffect, useState } from "react";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { FacultySubNav } from "../components/FacultySubNav";
import { useActor } from "../hooks/useActor";

// THE FINAL PATH: Updated to the new, simplified filename
const STATIC_CV = "/assets/uploads/cv.pdf"; 
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

export function FacultyCV() {
  const { actor } = useActor();
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor
      .getCvPdf()
      .then((data) => {
        // Use backend data if available, otherwise fallback to our simplified static file
        setPdfSrc(data?.trim() ? data : STATIC_CV);
      })
      .catch(() => {
        setPdfSrc(STATIC_CV);
      })
      .finally(() => setLoading(false));
  }, [actor]);

  // Fallback timeout — show static CV if actor never loads
  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) {
        setPdfSrc(STATIC_CV);
        setLoading(false);
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <div
      data-ocid="cv.page"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
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

      <AnthropoceneAnchor />
      <FacultySubNav />

      {loading ? (
        <div
          data-ocid="cv.loading_state"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#8C3A3A",
            }}
          >
            Loading CV...
          </p>
        </div>
      ) : (
        <embed
          src={pdfSrc ?? STATIC_CV}
          type="application/pdf"
          title="Curriculum Vitae — Abhishek Tiwari"
          data-ocid="cv.canvas_target"
          style={{
            flex: 1,
            width: "100%",
            height: "calc(100dvh - 120px)",
            border: "none",
            display: "block",
            position: "relative",
            zIndex: 5,
          }}
        />
      )}
    </div>
  );
}
