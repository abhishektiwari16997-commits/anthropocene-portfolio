import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  FileIcon,
  FrameIcon,
  GalleryHorizontalEnd,
  GalleryVerticalEnd,
  ImageIcon,
  Layers,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ArtPortfolioItem,
  DesignPortfolioItem,
  LectureItem,
  ResearchItem,
  StudentWorkItem,
} from "../backend.d";
import { STEALTH_TRIGGER_EVENT } from "../components/StealthAdminClaim";
import { useCursor } from "../context/CursorContext";
import { useActor } from "../hooks/useActor";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── UTILITIES ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB ICP Limit

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

function isAuthError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("unauthorized") ||
    msg.includes("not registered") ||
    msg.includes("trap") ||
    msg.includes("forbidden")
  );
}

async function withActorRetry<T>(
  getActor: () => import("../backend.d").backendInterface | null,
  fn: (actor: import("../backend.d").backendInterface) => Promise<T>,
  maxAttempts = 5,
): Promise<T> {
  let lastError: unknown = new Error("Actor not ready");
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const actor = getActor();
    if (actor) {
      try {
        return await fn(actor);
      } catch (err) {
        if (isAuthError(err)) throw err;
        lastError = err;
      }
    }
    await delay(1000 * 1.5 ** attempt);
  }
  throw lastError;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: "1px solid rgba(229,224,216,0.15)",
  padding: "0.75rem 1rem",
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "12px",
  color: "#E5E0D8",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "9px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "rgba(229,224,216,0.4)",
  marginBottom: "0.5rem",
};

type NavSection = "lectures" | "students-works" | "art-portfolio" | "design-portfolio" | "research" | "cv";

const SECTION_META: Record<NavSection, { title: string; description: string }> = {
  lectures: { title: "Lectures", description: "Manage lecture cards and Figma prototypes." },
  "students-works": { title: "Students Works", description: "Moderate student portfolio submissions." },
  "art-portfolio": { title: "Art Portfolio", description: "Manage art practice entries for the WebGL gallery." },
  "design-portfolio": { title: "Design Portfolio", description: "Manage curated design items and client work." },
  research: { title: "Research", description: "Manage floating research cards and sketches." },
  cv: { title: "CV", description: "Upload your CV PDF or set a public link." },
};

// ─── MODALS ───────────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ width: "100%", maxWidth: "480px", background: "#1a1a1a", border: "1px solid #333", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "serif", fontStyle: "italic", color: "#E5E0D8", margin: 0, fontSize: "20px" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "gray", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, value, onChange, placeholder }: any) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={labelStyle}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function FormTextarea({ label, value, onChange }: any) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
    </div>
  );
}

function SubmitButton({ onClick, isSubmitting, disabled }: any) {
  return (
    <button onClick={onClick} disabled={isSubmitting || disabled} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "0.8rem", border: "none", letterSpacing: "0.2em", fontSize: "10px", opacity: isSubmitting || disabled ? 0.5 : 1, cursor: "pointer" }}>
      {isSubmitting ? "UPLOADING TO CANISTER..." : "SAVE ENTRY"}
    </button>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();
  const { identity, login: iiLogin } = useInternetIdentity();
  const { actor, isFetching: isActorFetching } = useActor();
  const isActorReady = !!actor && !isActorFetching;

  const [activeSection, setActiveSection] = useState<NavSection>("art-portfolio");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Data States
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [studentWorks, setStudentWorks] = useState<StudentWorkItem[]>([]);
  const [artItems, setArtItems] = useState<ArtPortfolioItem[]>([]);
  const [designItems, setDesignItems] = useState<DesignPortfolioItem[]>([]);
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form States (Modal)
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protection
  useEffect(() => { if (!isAuthenticated) navigate({ to: "/admin" }); }, [isAuthenticated, navigate]);

  // 1. THE CRITICAL FIX: Safe Fetch Logic
  const loadSectionData = useCallback(async (section: NavSection) => {
    if (!actor) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      if (section === "art-portfolio") {
        const data = await actor.listAllArtItems();
        setArtItems(data);
      } else if (section === "lectures") {
        try { const data = await actor.listAllLectures(); setLectures(data); } 
        catch { setLectures([]); setLoadError("Lecture methods not yet available on backend."); }
      } else if (section === "students-works") {
        try { const data = await actor.listAllStudentWorks(); setStudentWorks(data); }
        catch { setStudentWorks([]); setLoadError("Student Work methods not yet available."); }
      } else if (section === "design-portfolio") {
        try { const data = await actor.listAllDesignPortfolio(); setDesignItems(data); }
        catch { setDesignItems([]); setLoadError("Design Portfolio methods not yet available."); }
      } else if (section === "research") {
        try { const data = await actor.listAllResearchItems(); setResearchItems(data); }
        catch { setResearchItems([]); setLoadError("Research methods not yet available."); }
      }
    } catch (e: any) {
      setLoadError("Canister communication error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => { if (isAuthenticated && actor) loadSectionData(activeSection); }, [activeSection, actor, isAuthenticated, loadSectionData]);

  // 2. THE UPLOAD LOGIC
  const handleUpload = async () => {
    if (!actor || !identity) { iiLogin(); return; }
    if (!title.trim()) { alert("Title is required"); return; }
    setIsSubmitting(true);
    try {
      if (activeSection === "art-portfolio") {
        await actor.addArtItem(title, image);
      } else if (activeSection === "students-works") {
        await actor.addStudentWork(title, desc, image, "");
      } else if (activeSection === "research") {
        await actor.addResearchItem(title, desc, image);
      }
      setShowAddModal(false);
      setTitle(""); setDesc(""); setImage("");
      loadSectionData(activeSection);
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFile = (e: any) => {
    const file = e.target.files[0];
    if (file && file.size > MAX_FILE_SIZE) { alert("File too large (>2MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const currentList = activeSection === "art-portfolio" ? artItems :
                    activeSection === "lectures" ? lectures :
                    activeSection === "students-works" ? studentWorks :
                    activeSection === "design-portfolio" ? designItems : researchItems;

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#E5E0D8", fontFamily: 'monospace' }}>
      {/* SIDEBAR */}
      <aside style={{ width: "240px", background: "#111", borderRight: "1px solid #222", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "2.5rem 1.5rem" }}>
          <p style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "22px", margin: 0 }}>Mr. Anthropocene</p>
          <p style={{ fontSize: "8px", opacity: 0.4, letterSpacing: "0.4em", marginTop: "8px" }}>ADMINISTRATION</p>
        </div>
        
        <nav style={{ flex: 1 }}>
          {[
            { id: "art-portfolio", label: "Art Portfolio", icon: <ImageIcon size={14} /> },
            { id: "design-portfolio", label: "Design Portfolio", icon: <GalleryVerticalEnd size={14} /> },
            { id: "students-works", label: "Student Works", icon: <GalleryHorizontalEnd size={14} /> },
            { id: "lectures", label: "Lectures", icon: <BookOpen size={14} /> },
            { id: "research", label: "Research", icon: <Layers size={14} /> },
            { id: "cv", label: "Manage CV", icon: <FileIcon size={14} /> },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id as NavSection)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.9rem 1.5rem", background: "transparent", border: "none", borderLeft: activeSection === item.id ? "3px solid #8C3A3A" : "3px solid transparent", opacity: activeSection === item.id ? 1 : 0.4, cursor: "pointer", color: "#E5E0D8", textAlign: "left" }}>
              {item.icon} <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "1.5rem", borderTop: "1px solid #222" }}>
          <button onClick={() => iiLogin()} style={{ width: "100%", background: identity ? "#1a1a1a" : "#8C3A3A", color: "#fff", border: "1px solid #333", padding: "0.7rem", fontSize: "9px", cursor: "pointer", marginBottom: "1rem" }}>
            {identity ? "II: CONNECTED" : "CONNECT IDENTITY"}
          </button>
          <button onClick={() => { logout(); navigate({ to: "/admin" }); }} style={{ width: "100%", background: "none", color: "#444", border: "none", fontSize: "9px", cursor: "pointer" }}>LOGOUT</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "4rem", overflowY: "auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4rem" }}>
          <div>
            <h1 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "36px", margin: 0 }}>{SECTION_META[activeSection].title}</h1>
            <p style={{ fontSize: "12px", color: "gray", marginTop: "8px" }}>{SECTION_META[activeSection].description}</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ background: "#8C3A3A", color: "#fff", border: "none", padding: "0.8rem 2.2rem", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>+ ADD NEW</button>
        </header>

        {loadError && <div style={{ background: "rgba(140,58,58,0.1)", border: "1px solid rgba(140,58,58,0.2)", color: "#8C3A3A", padding: "1.25rem", fontSize: "11px", marginBottom: "2.5rem" }}>⚠ {loadError}</div>}

        <div style={{ background: "#080808", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", padding: "1rem", borderBottom: "1px solid #222", background: "#111", fontSize: "9px", color: "gray", letterSpacing: "0.2em" }}>
            <span>TITLE / ENTRY NAME</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>
          {isLoading ? <p style={{ padding: "3rem", textAlign: "center", fontSize: "11px", opacity: 0.5 }}>Syncing with ICP Canister...</p> : 
            currentList.map((item: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", padding: "1.25rem 1rem", borderBottom: "1px solid #111", alignItems: "center", fontSize: "13px" }}>
                <span style={{ fontWeight: 500 }}>{item.title || item.studentName}</span>
                <span style={{ fontSize: "9px", color: item.isLive ? "#4CAF50" : "#444" }}>{item.isLive ? "● LIVE" : "○ DRAFT"}</span>
                <button style={{ background: "none", border: "1px solid #333", color: "gray", fontSize: "9px", padding: "4px 8px", cursor: "pointer" }}>MANAGE</button>
              </div>
            ))
          }
          {!isLoading && currentList.length === 0 && <p style={{ padding: "5rem", textAlign: "center", color: "#222", fontSize: "11px", letterSpacing: "0.2em" }}>NO RECORDS FOUND</p>}
        </div>
      </main>

      {/* DYNAMIC MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <ModalShell title={`Add to ${SECTION_META[activeSection].title}`} onClose={() => setShowAddModal(false)}>
            <FormField label="Title / Heading" value={title} onChange={setTitle} placeholder="Enter name of the entry..." />
            
            {(activeSection === "students-works" || activeSection === "research" || activeSection === "lectures") && (
              <FormTextarea label="Narrative / Description" value={desc} onChange={setDesc} />
            )}

            <label style={labelStyle}>Primary Media (PNG/JPG)</label>
            <input type="file" accept="image/*" onChange={handleFile} style={{ marginBottom: "2rem", fontSize: "11px", color: "gray" }} />
            
            {image && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={image} style={{ width: "100%", height: "150px", objectFit: "cover", marginBottom: "1.5rem", border: "1px solid #333" }} />}

            <SubmitButton onClick={handleUpload} isSubmitting={isSubmitting} disabled={!isActorReady} />
            {!identity && <p style={{ fontSize: "9px", color: "#8C3A3A", textAlign: "center", marginTop: "1rem" }}>Connecting Internet Identity is required to save.</p>}
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}
