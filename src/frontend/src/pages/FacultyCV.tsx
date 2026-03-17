import { useEffect, useState } from "react";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { FacultySubNav } from "../components/FacultySubNav";
import { useActor } from "../hooks/useActor";

// THE FIX: Direct path to your assets folder in the public root
const STATIC_CV = "/assets/CV_Abhishek_Tiwari_2.pdf"; 
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

export function FacultyCV() {import { useEffect, useState } from "react";
import { AnthropoceneAnchor } from "../components/AnthropoceneAnchor";
import { FacultySubNav } from "../components/FacultySubNav";
import { useActor } from "../hooks/useActor";

// THE FIX: Points exactly to your folder: frontend/public/assets/CV_Abhishek_Tiwari_2.pdf
const STATIC_CV = "/assets/CV_Abhishek_Tiwari_2.pdf"; 
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
        // Use backend data if available, otherwise fallback to our confirmed static path
        setPdfSrc(data?.trim() ? data : STATIC_CV);
      })
      .catch(() => {
        setPdfSrc(STATIC_CV);
      })
      .finally(() => setLoading(false));
  }, [actor]);

  // Fallback: If blockchain is slow, show the static PDF after 2 seconds
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
      {/* Aesthetic Grain Overlay */}
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
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "10px", letterSpacing: "0.3em", color: "#8C3A3A" }}>
            Loading CV...
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <embed
            src={pdfSrc ?? STATIC_CV}
            type="application/pdf"
            title="Curriculum Vitae — Abhishek Tiwari"
            style={{
              flex: 1,
              width: "100%",
              height: "calc(100dvh - 120px)",
              border: "none",
              zIndex: 5,
            }}
          />
        </div>
      )}
    </div>
  );
}
  const { actor } = useActor();
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor
      .getCvPdf()
      .then((data) => {
        setPdfSrc(data?.trim() ? data : STATIC_CV);
      })
      .catch(() => {
        setPdfSrc(STATIC_CV);
      })
      .finally(() => setLoading(false));
  }, [actor]);

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
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "10px", letterSpacing: "0.3em", color: "#8C3A3A" }}>
            Loading CV...
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <embed
            src={pdfSrc ?? STATIC_CV}
            type="application/pdf"
            title="Curriculum Vitae — Abhishek Tiwari"
            style={{
              flex: 1,
              width: "100%",
              height: "calc(100dvh - 160px)",
              border: "none",
              zIndex: 5,
            }}
          />
          {/* Fallback Link */}
          <div style={{ padding: "20px", textAlign: "center", zIndex: 20 }}>
            <a 
              href={STATIC_CV} 
              target="_blank" 
              rel="noreferrer"
              style={{ color: "#8C3A3A", fontSize: "10px", textDecoration: "none", letterSpacing: "0.1em", pointerEvents: "auto" }}
            >
              [ IF PDF DOES NOT LOAD, CLICK HERE TO VIEW DIRECTLY ]
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
