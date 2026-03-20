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

// ─── UTILITIES ─────────────────────────────────────────────────────────────

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
  maxAttempts = 6,
  baseDelayMs = 1500,
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
    if (attempt < maxAttempts - 1) {
      await delay(baseDelayMs * 1.5 ** attempt);
    }
  }
  throw lastError;
}

// ─── STYLES ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111111",
  border: "1px solid rgba(229,224,216,0.15)",
  borderRadius: "0",
  padding: "0.75rem 1rem",
  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
  fontSize: "12px",
  color: "#E5E0D8",
  outline: "none",
  transition: "border-color 0.2s ease",
  cursor: "text",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
  fontSize: "9px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "rgba(229,224,216,0.4)",
  marginBottom: "0.5rem",
  cursor: "default",
};

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────

function ActorNotReadyBanner({ onRetry, isActorFetching }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ background: "rgba(229,224,216,0.04)", border: "1px solid rgba(229,224,216,0.1)", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
      <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(229,224,216,0.5)' }}>
        {isActorFetching ? "Securing connection..." : "Connection standby."}
      </p>
      <button onClick={onRetry} style={{ background: 'none', border: '1px solid #333', color: '#fff', fontSize: '8px', padding: '2px 8px' }}>RETRY</button>
    </motion.div>
  );
}

function ModalShell({ title, onClose, children }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ width: "100%", maxWidth: "500px", background: "#1a1a1a", border: "1px solid #333", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "serif", fontStyle: "italic", color: "#E5E0D8", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "gray", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── SPECIFIC MODAL FORMS ──────────────────────────────────────────────────

function AddArtItemModal({ onClose, onSuccess, actor, isActorReady, identity }: any) {
  const [title, setTitle] = useState("");
  const [img, setImg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e: any) => {
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target?.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!identity) { alert("Connect Internet Identity first!"); return; }
    setSubmitting(true);
    try {
      await actor.addArtItem(title, img);
      onSuccess(); onClose();
    } catch (e: any) { alert("Save Failed: " + e.message); } finally { setSubmitting(false); }
  };

  return (
    <ModalShell title="Add Art Practice" onClose={onClose}>
      <label style={labelStyle}>Artwork Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label style={labelStyle}>Image File</label>
      <input type="file" accept="image/*" onChange={handleFile} style={{ marginBottom: "1.5rem" }} />
      {img && <img src={img} style={{ width: "100%", height: "150px", objectFit: "cover", marginBottom: "1rem" }} />}
      <button onClick={handleSave} disabled={submitting || !isActorReady} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", opacity: submitting ? 0.5 : 1 }}>
        {submitting ? "SAVING TO BLOCKCHAIN..." : "SAVE ARTWORK"}
      </button>
    </ModalShell>
  );
}

function AddStudentWorkModal({ onClose, onSuccess, actor, isActorReady, identity }: any) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e: any) => {
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target?.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await actor.addStudentWork(name, desc, img, "");
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  return (
    <ModalShell title="Add Student Work" onClose={onClose}>
      <label style={labelStyle}>Student Name</label>
      <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      <label style={labelStyle}>Description</label>
      <textarea style={{ ...inputStyle, height: "100px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <input type="file" accept="image/*" onChange={handleFile} style={{ margin: "1rem 0" }} />
      <button onClick={handleSave} disabled={submitting} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none" }}>SAVE WORK</button>
    </ModalShell>
  );
}

// ─── REPEAT FOR LECTURE, DESIGN, RESEARCH (Expanded version) ────────────────

function AddLectureModal({ onClose, onSuccess, actor }: any) {
  const [t, setT] = useState("");
  const [u, setU] = useState("");
  const [d, setD] = useState("");
  const [s, setS] = useState(false);
  const handle = async () => {
    setS(true);
    try { await actor.addLecture(t, u, d, "40 min", ""); onSuccess(); onClose(); } 
    catch (e: any) { alert("Backend Error: " + e.message); } finally { setS(false); }
  };
  return (
    <ModalShell title="Add Lecture" onClose={onClose}>
      <label style={labelStyle}>Title</label><input style={inputStyle} onChange={e => setT(e.target.value)} />
      <label style={labelStyle}>Figma URL</label><input style={inputStyle} onChange={e => setU(e.target.value)} />
      <label style={labelStyle}>Description</label><textarea style={{...inputStyle, height:'80px'}} onChange={e => setD(e.target.value)} />
      <button onClick={handle} style={{width:'100%', background:'#8C3A3A', color:'#fff', padding:'1rem', border:'none', marginTop:'1rem'}}>{s ? "SAVING..." : "SAVE LECTURE"}</button>
    </ModalShell>
  );
}

function AddResearchItemModal({ onClose, onSuccess, actor }: any) {
  const [t, setT] = useState("");
  const [d, setD] = useState("");
  const [i, setI] = useState("");
  const handleFile = (e:any) => {
    const reader = new FileReader();
    reader.onload = (ev) => setI(ev.target?.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };
  const handle = async () => {
    try { await actor.addResearchItem(t, d, i); onSuccess(); onClose(); } catch (e: any) { alert(e.message); }
  };
  return (
    <ModalShell title="Add Research Card" onClose={onClose}>
      <label style={labelStyle}>Title</label><input style={inputStyle} onChange={e => setT(e.target.value)} />
      <label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height:'80px'}} onChange={e => setD(e.target.value)} />
      <input type="file" onChange={handleFile} style={{margin:'1rem 0'}} />
      <button onClick={handle} style={{width:'100%', background:'#8C3A3A', color:'#fff', padding:'1rem', border:'none'}}>SAVE RESEARCH</button>
    </ModalShell>
  );
}

// ─── MAIN DASHBOARD LOGIC ──────────────────────────────────────────────────

export function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();
  const { identity, login: iiLogin, isLoggingIn } = useInternetIdentity();
  const { actor, isFetching: isActorFetching } = useActor();
  const isActorReady = !!actor && !isActorFetching;

  const [activeSection, setActiveSection] = useState<NavSection>("art-portfolio");
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [studentWorks, setStudentWorks] = useState<StudentWorkItem[]>([]);
  const [artItems, setArtItems] = useState<ArtPortfolioItem[]>([]);
  const [designItems, setDesignItems] = useState<DesignPortfolioItem[]>([]);
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  type NavSection = "lectures" | "students-works" | "art-portfolio" | "design-portfolio" | "research" | "cv";

  // 1. SAFE DATA LOADING (Bypasses Method Not Found Errors)
  const loadData = useCallback(async (section: NavSection) => {
    if (!actor) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      if (section === "art-portfolio") {
        const d = await actor.listAllArtItems(); setArtItems(d);
      } else if (section === "lectures") {
        try { const d = await actor.listAllLectures(); setLectures(d); } catch { setLoadError("Lecture methods not deployed."); }
      } else if (section === "students-works") {
        try { const d = await actor.listAllStudentWorks(); setStudentWorks(d); } catch { setLoadError("Student methods not deployed."); }
      } else if (section === "design-portfolio") {
        try { const d = await actor.listAllDesignPortfolio(); setDesignItems(d); } catch { setLoadError("Design methods not deployed."); }
      } else if (section === "research") {
        try { const d = await actor.listAllResearchItems(); setResearchItems(d); } catch { setLoadError("Research methods not deployed."); }
      }
    } catch (e: any) {
      setLoadError("Communication error with Canister.");
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => { if (isAuthenticated && actor) loadData(activeSection); }, [activeSection, actor, isAuthenticated, loadData]);

  if (!isAuthenticated) return null;

  const currentList = activeSection === "art-portfolio" ? artItems :
                    activeSection === "lectures" ? lectures :
                    activeSection === "students-works" ? studentWorks :
                    activeSection === "design-portfolio" ? designItems : researchItems;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#E5E0D8", fontFamily: 'monospace' }}>
      {/* SIDEBAR */}
      <aside style={{ width: "240px", background: "#111", borderRight: "1px solid #222", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "2.5rem 1.5rem" }}>
          <p style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "22px", margin: 0 }}>Anthropocene</p>
          <p style={{ fontSize: "8px", opacity: 0.3, letterSpacing: "0.4em", marginTop: "5px" }}>STUDIO PANEL</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { id: "art-portfolio", label: "Art Portfolio", icon: <ImageIcon size={14} /> },
            { id: "design-portfolio", label: "Design Portfolio", icon: <GalleryVerticalEnd size={14} /> },
            { id: "students-works", label: "Student Works", icon: <GalleryHorizontalEnd size={14} /> },
            { id: "lectures", label: "Lectures", icon: <BookOpen size={14} /> },
            { id: "research", label: "Research", icon: <Layers size={14} /> },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id as NavSection)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.9rem 1.5rem", background: "transparent", border: "none", borderLeft: activeSection === item.id ? "3px solid #8C3A3A" : "3px solid transparent", opacity: activeSection === item.id ? 1 : 0.4, cursor: "pointer", color: "#E5E0D8", textAlign: "left" }}>
              {item.icon} <span style={{ fontSize: "10px", textTransform: "uppercase" }}>{item.label}</span>
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
          <h1 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "36px", margin: 0 }}>Manage {activeSection.replace("-", " ")}</h1>
          <button onClick={() => setShowAddModal(true)} style={{ background: "#8C3A3A", color: "#fff", border: "none", padding: "0.8rem 2.2rem", fontSize: "11px", cursor: "pointer" }}>+ ADD NEW</button>
        </header>

        {loadError && <div style={{ background: "rgba(140,58,58,0.1)", color: "#8C3A3A", padding: "1.25rem", fontSize: "11px", marginBottom: "2.5rem" }}>⚠ {loadError}</div>}

        <div style={{ background: "#080808", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", padding: "1rem", background: "#111", fontSize: "9px", color: "gray", letterSpacing: "0.2em" }}>
            <span>TITLE / ENTRY NAME</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>
          {isLoading ? <p style={{ padding: "3rem", textAlign: "center", fontSize: "11px", opacity: 0.5 }}>Syncing with ICP...</p> : 
            currentList.map((item: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", padding: "1.25rem 1rem", borderBottom: "1px solid #111", alignItems: "center", fontSize: "13px" }}>
                <span>{item.title || item.studentName}</span>
                <span style={{ fontSize: "9px", color: item.isLive ? "#4CAF50" : "#444" }}>{item.isLive ? "● LIVE" : "○ DRAFT"}</span>
                <button style={{ background: "none", border: "1px solid #333", color: "gray", fontSize: "9px", padding: "4px 8px" }}>MANAGE</button>
              </div>
            ))
          }
          {!isLoading && currentList.length === 0 && <p style={{ padding: "5rem", textAlign: "center", color: "#222", fontSize: "11px" }}>NO RECORDS FOUND</p>}
        </div>
      </main>

      {/* MODAL DISPATCHER */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {activeSection === "art-portfolio" && <AddArtItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("art-portfolio")} actor={actor} isActorReady={isActorReady} identity={identity} />}
            {activeSection === "students-works" && <AddStudentWorkModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("students-works")} actor={actor} isActorReady={isActorReady} identity={identity} />}
            {activeSection === "lectures" && <AddLectureModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("lectures")} actor={actor} />}
            {activeSection === "research" && <AddResearchItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("research")} actor={actor} />}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
