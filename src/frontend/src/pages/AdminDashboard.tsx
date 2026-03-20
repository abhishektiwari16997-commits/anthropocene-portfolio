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

// ─── UTILITIES & CONSTANTS ───────────────────────────────────────────────────

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB Limit for ICP uploads

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111111",
  border: "1px solid rgba(229,224,216,0.15)",
  borderRadius: "0",
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
  "students-works": { title: "Students Works", description: "Manage student portfolio submissions." },
  "art-portfolio": { title: "Art Portfolio", description: "Manage art practice entries for the WebGL gallery." },
  "design-portfolio": { title: "Design Portfolio", description: "Manage design projects and client work." },
  research: { title: "Research", description: "Manage research cards, poems, and sketches." },
  cv: { title: "CV", description: "Update your CV destination or PDF link." },
};

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(15px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div initial={{ scale: 0.96, y: 15 }} animate={{ scale: 1, y: 0 }} style={{ width: "100%", maxWidth: "500px", background: "#151515", border: "1px solid #252525", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "24px", color: "#E5E0D8", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "gray", cursor: "pointer" }}><X size={22} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, value, onChange }: any) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <label style={labelStyle}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

function FormTextarea({ label, value, onChange }: any) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
    </div>
  );
}

function SaveButton({ onClick, isSubmitting, disabled, label }: any) {
  return (
    <button onClick={onClick} disabled={isSubmitting || disabled} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", letterSpacing: "0.25em", fontSize: "10px", fontWeight: "bold", opacity: isSubmitting || disabled ? 0.4 : 1, cursor: "pointer", marginTop: "1rem" }}>
      {isSubmitting ? "SYNCING WITH BLOCKCHAIN..." : label || "SAVE ENTRY"}
    </button>
  );
}

// ─── SPECIFIC MODAL COMPONENTS (STRICT ACTOR GUARDS) ──────────────────────────

function AddArtItemModal({ onClose, onSuccess, actor, identity }: any) {
  const [title, setTitle] = useState("");
  const [img, setImg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e: any) => {
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target?.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!actor) return alert("Backend connection lost. Refresh page.");
    setSubmitting(true);
    try {
      await actor.addArtItem(title, img);
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  return (
    <ModalShell title="Add Art Practice" onClose={onClose}>
      <FormField label="Artwork Title" value={title} onChange={setTitle} />
      <label style={labelStyle}>Image Asset</label>
      <input type="file" accept="image/*" onChange={handleFile} style={{ marginBottom: "1rem" }} />
      {img && <img src={img} style={{ width: "100%", height: "120px", objectFit: "cover", marginBottom: "1rem" }} />}
      <SaveButton onClick={handleSave} isSubmitting={submitting} disabled={!actor || !identity} />
    </ModalShell>
  );
}

function AddStudentWorkModal({ onClose, onSuccess, actor, identity }: any) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!actor) return alert("Backend connection lost.");
    setSubmitting(true);
    try {
      await actor.addStudentWork(name, desc, img, "");
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  return (
    <ModalShell title="Add Student Work" onClose={onClose}>
      <FormField label="Student Name" value={name} onChange={setName} />
      <FormTextarea label="Narrative" value={desc} onChange={setDesc} />
      <input type="file" accept="image/*" onChange={(e:any) => {
        const r = new FileReader(); r.onload = (ev) => setImg(ev.target?.result as string); r.readAsDataURL(e.target.files[0]);
      }} />
      <SaveButton onClick={handleSave} isSubmitting={submitting} disabled={!actor || !identity} />
    </ModalShell>
  );
}

function AddResearchItemModal({ onClose, onSuccess, actor, identity }: any) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    // THIS PREVENTS THE "NULL" ERROR FROM YOUR SCREENSHOT
    if (!actor) {
      alert("System not ready. Please wait a few seconds or re-authenticate.");
      return;
    }
    setSubmitting(true);
    try {
      await actor.addResearchItem(title, desc, img);
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  return (
    <ModalShell title="Add Research Card" onClose={onClose}>
      <FormField label="Title" value={title} onChange={setTitle} />
      <FormTextarea label="Notes / Fragments" value={desc} onChange={setDesc} />
      <input type="file" onChange={(e:any) => {
        const r = new FileReader(); r.onload = (ev) => setImg(ev.target?.result as string); r.readAsDataURL(e.target.files[0]);
      }} style={{ marginBottom: "1.5rem" }} />
      <SaveButton onClick={handleSave} isSubmitting={submitting} disabled={!actor || !identity} label="SAVE RESEARCH" />
    </ModalShell>
  );
}

function AddLectureModal({ onClose, onSuccess, actor, identity }: any) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleSave = async () => {
    if (!actor) return;
    setSubmitting(true);
    try { await actor.addLecture(title, url, desc, "45 min", ""); onSuccess(); onClose(); } 
    catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };
  return (
    <ModalShell title="Add Lecture" onClose={onClose}>
      <FormField label="Lecture Title" value={title} onChange={setTitle} />
      <FormField label="Figma Prototype URL" value={url} onChange={setUrl} />
      <FormTextarea label="Summary" value={desc} onChange={setDesc} />
      <SaveButton onClick={handleSave} isSubmitting={submitting} disabled={!actor || !identity} />
    </ModalShell>
  );
}

// ─── MAIN ADMIN DASHBOARD ──────────────────────────────────────────────────────

export function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();
  const { identity, login: iiLogin } = useInternetIdentity();
  const { actor, isFetching: isActorFetching } = useActor();

  const [activeSection, setActiveSection] = useState<NavSection>("art-portfolio");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [studentWorks, setStudentWorks] = useState<StudentWorkItem[]>([]);
  const [artItems, setArtItems] = useState<ArtPortfolioItem[]>([]);
  const [designItems, setDesignItems] = useState<DesignPortfolioItem[]>([]);
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [cvLink, setCvLink] = useState("");

  const loadSection = useCallback(async (section: NavSection) => {
    if (!actor) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      if (section === "art-portfolio") {
        const d = await actor.listAllArtItems(); setArtItems(d);
      } else if (section === "lectures") {
        try { const d = await actor.listAllLectures(); setLectures(d); } catch { setLoadError("Lecture methods not deployed."); }
      } else if (section === "students-works") {
        try { const d = await actor.listAllStudentWorks(); setStudentWorks(d); } catch { setLoadError("Student Work methods not deployed."); }
      } else if (section === "research") {
        try { const d = await actor.listAllResearchItems(); setResearchItems(d); } catch { setLoadError("Research methods not deployed."); }
      } else if (section === "cv") {
        try { const l = await actor.getCvLink(); setCvLink(l); } catch { setLoadError("CV methods not deployed."); }
      }
    } catch (e) {
      setLoadError("Communication error with blockchain.");
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => { if (isAuthenticated && actor) loadSection(activeSection); }, [activeSection, actor, isAuthenticated, loadSection]);

  const handleToggleLive = async (id: bigint, current: boolean) => {
    if (!actor) return;
    try {
      if (activeSection === "art-portfolio") await actor.setArtItemLive(id, !current);
      else if (activeSection === "students-works") await actor.setStudentWorkLive(id, !current);
      else if (activeSection === "research") await actor.setResearchItemLive(id, !current);
      loadSection(activeSection);
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor || !confirm("Delete this entry forever?")) return;
    try {
      if (activeSection === "art-portfolio") await actor.deleteArtItem(id);
      else if (activeSection === "students-works") await actor.deleteStudentWork(id);
      loadSection(activeSection);
    } catch (e: any) { alert(e.message); }
  };

  if (!isAuthenticated) return null;

  const currentList = activeSection === "art-portfolio" ? artItems :
                    activeSection === "lectures" ? lectures :
                    activeSection === "students-works" ? studentWorks :
                    activeSection === "design-portfolio" ? designItems : researchItems;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#E5E0D8", fontFamily: "monospace" }}>
      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "#0c0c0c", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "3rem 2rem" }}>
          <p style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "24px", margin: 0 }}>Anthropocene</p>
          <p style={{ fontSize: "8px", opacity: 0.3, letterSpacing: "0.5em", marginTop: "10px" }}>STUDIO PANEL</p>
        </div>
        
        <nav style={{ flex: 1 }}>
          {[
            { id: "art-portfolio", label: "Art Portfolio", icon: <ImageIcon size={15} /> },
            { id: "students-works", label: "Student Works", icon: <GalleryHorizontalEnd size={15} /> },
            { id: "lectures", label: "Lectures", icon: <BookOpen size={15} /> },
            { id: "research", label: "Research", icon: <Layers size={15} /> },
            { id: "cv", label: "Manage CV", icon: <FileIcon size={15} /> },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id as NavSection)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1.1rem 2rem", background: "transparent", border: "none", borderLeft: activeSection === item.id ? "4px solid #8C3A3A" : "4px solid transparent", opacity: activeSection === item.id ? 1 : 0.3, cursor: "pointer", color: "#E5E0D8", textAlign: "left", transition: "0.2s" }}>
              {item.icon} <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "2rem", borderTop: "1px solid #1a1a1a" }}>
          <button onClick={() => iiLogin()} style={{ width: "100%", background: identity ? "#151515" : "#8C3A3A", color: "#fff", border: "1px solid #333", padding: "0.8rem", fontSize: "9px", cursor: "pointer", marginBottom: "1rem" }}>
            {identity ? "II: AUTHENTICATED" : "CONNECT IDENTITY"}
          </button>
          <button onClick={() => { logout(); navigate({ to: "/admin" }); }} style={{ width: "100%", background: "none", color: "#444", border: "none", fontSize: "9px", cursor: "pointer" }}>SIGNOUT</button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main style={{ flex: 1, padding: "5rem", overflowY: "auto", background: "radial-gradient(circle at top right, #080808, #000)" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem" }}>
          <div>
            <h1 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "44px", margin: 0 }}>{SECTION_META[activeSection].title}</h1>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "12px", maxWidth: "450px" }}>{SECTION_META[activeSection].description}</p>
          </div>
          {activeSection !== "cv" && (
            <button onClick={() => setShowAddModal(true)} style={{ background: "#8C3A3A", color: "#fff", border: "none", padding: "1.1rem 2.5rem", fontSize: "11px", cursor: "pointer", fontWeight: "bold", letterSpacing: "0.2em" }}>
              + ADD NEW
            </button>
          )}
        </header>

        {loadError && <div style={{ background: "rgba(140,58,58,0.05)", border: "1px solid rgba(140,58,58,0.15)", color: "#8C3A3A", padding: "1.2rem", fontSize: "11px", marginBottom: "3rem" }}>⚠ {loadError}</div>}

        <div style={{ background: "#050505", border: "1px solid #111" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px", padding: "1.2rem 1.5rem", background: "#0c0c0c", borderBottom: "1px solid #1a1a1a", fontSize: "9px", color: "#444", letterSpacing: "0.2em" }}>
            <span>IDENTIFIER / TITLE</span>
            <span>VISIBILITY</span>
            <span>ACTIONS</span>
          </div>
          {isLoading ? <div style={{ padding: "5rem", textAlign: "center", fontSize: "11px", color: "#333" }}>SYNCHRONIZING WITH BLOCKCHAIN...</div> : 
            currentList.map((item: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px", padding: "1.5rem", borderBottom: "1px solid #0f0f0f", alignItems: "center", fontSize: "14px" }}>
                <span>{item.title || item.studentName}</span>
                <span style={{ fontSize: "9px", color: item.isLive ? "#4CAF50" : "#333" }}>{item.isLive ? "● LIVE" : "○ DRAFT"}</span>
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <button onClick={() => handleToggleLive(item.id, item.isLive)} style={{ background: "none", border: "1px solid #222", color: "#666", fontSize: "9px", padding: "5px 10px", cursor: "pointer" }}>TOGGLE</button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "1px solid #222", color: "#8C3A3A", fontSize: "9px", padding: "5px 10px", cursor: "pointer" }}>DELETE</button>
                </div>
              </div>
            ))
          }
          {!isLoading && currentList.length === 0 && <div style={{ padding: "6rem", textAlign: "center", color: "#1a1a1a", fontSize: "10px", letterSpacing: "0.5em" }}>NO RECORDS FOUND</div>}
        </div>
      </main>

      {/* MODAL DISPATCHER (STRICT ACTOR PROP) */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {activeSection === "art-portfolio" && <AddArtItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("art-portfolio")} actor={actor} identity={identity} />}
            {activeSection === "students-works" && <AddStudentWorkModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("students-works")} actor={actor} identity={identity} />}
            {activeSection === "research" && <AddResearchItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("research")} actor={actor} identity={identity} />}
            {activeSection === "lectures" && <AddLectureModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("lectures")} actor={actor} identity={identity} />}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
