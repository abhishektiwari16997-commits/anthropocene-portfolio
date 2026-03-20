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

// ─── CONSTANTS & TYPES ────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB ICP Limit

type NavSection =
  | "lectures"
  | "students-works"
  | "art-portfolio"
  | "design-portfolio"
  | "research"
  | "cv";

const SECTION_META: Record<NavSection, { title: string; description: string }> = {
  lectures: {
    title: "Lectures",
    description: "Manage lecture cards and embedded Figma prototypes for the WebEcology series.",
  },
  "students-works": {
    title: "Students Works",
    description: "Manage and moderate student portfolio submissions from the design faculty.",
  },
  "art-portfolio": {
    title: "Art Portfolio",
    description: "Manage art practice entries and gallery images for the WebGL gallery.",
  },
  "design-portfolio": {
    title: "Design Portfolio",
    description: "Manage curated design portfolio items including client work and self-initiated projects.",
  },
  research: {
    title: "Research",
    description: "Manage floating canvas research cards — images, poems, sketches, and thought fragments.",
  },
  cv: {
    title: "CV",
    description: "Upload your Curriculum Vitae PDF or set a CV link. This will appear on the public CV page.",
  },
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

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

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ width: "100%", maxWidth: "500px", background: "#1a1a1a", border: "1px solid #333", padding: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "22px", color: "#E5E0D8", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "gray", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── MODAL FORMS ──────────────────────────────────────────────────────────────

function AddLectureModal({ onClose, onSuccess, actor }: any) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!actor) return; // Silent wait
    setLoading(true);
    try {
      await actor.addLecture(title, url, desc, "45 min", "");
      onSuccess(); onClose();
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Lecture" onClose={onClose}>
      <label style={labelStyle}>Lecture Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <label style={labelStyle}>Figma URL</label>
      <input style={inputStyle} value={url} onChange={(e) => setUrl(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <label style={labelStyle}>Description</label>
      <textarea style={{ ...inputStyle, height: "100px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <button onClick={handleSave} disabled={loading || !actor} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "2rem", cursor: "pointer", opacity: (!actor || loading) ? 0.5 : 1 }}>
        {loading ? "SAVING..." : actor ? "SAVE LECTURE" : "CONNECTING..."}
      </button>
    </ModalShell>
  );
}

function AddStudentWorkModal({ onClose, onSuccess, actor }: any) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e: any) => {
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target?.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      await actor.addStudentWork(name, desc, img, "");
      onSuccess(); onClose();
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Student Work" onClose={onClose}>
      <label style={labelStyle}>Student Name</label>
      <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <label style={labelStyle}>Description</label>
      <textarea style={{ ...inputStyle, height: "100px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: "10px" }} />
      <button onClick={handleSave} disabled={loading || !actor} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "2rem", cursor: "pointer", opacity: (!actor || loading) ? 0.5 : 1 }}>
        {loading ? "UPLOADING..." : actor ? "SAVE WORK" : "CONNECTING..."}
      </button>
    </ModalShell>
  );
}

function AddArtItemModal({ onClose, onSuccess, actor }: any) {
  const [title, setTitle] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e: any) => {
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target?.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      await actor.addArtItem(title, img);
      onSuccess(); onClose();
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Art Practice" onClose={onClose}>
      <label style={labelStyle}>Artwork Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <label style={labelStyle}>Art Image</label>
      <input type="file" accept="image/*" onChange={handleFile} />
      {img && <img src={img} style={{ width: "100%", height: "150px", objectFit: "cover", marginTop: "1.5rem", border: "1px solid #333" }} />}
      <button onClick={handleSave} disabled={loading || !actor} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "2rem", cursor: "pointer", opacity: (!actor || loading) ? 0.5 : 1 }}>
        {loading ? "SAVING..." : actor ? "SAVE ARTWORK" : "CONNECTING..."}
      </button>
    </ModalShell>
  );
}

function AddResearchItemModal({ onClose, onSuccess, actor }: any) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e: any) => {
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target?.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = async () => {
    // FIX FOR Screenshot 2026-03-20 132403.png
    // We strictly check the actor here. If it's missing, we wait for the hook to provide it.
    if (!actor) return; 
    setLoading(true);
    try {
      await actor.addResearchItem(title, desc, img);
      onSuccess(); onClose();
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Research Card" onClose={onClose}>
      <label style={labelStyle}>Title / Fragment</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <label style={labelStyle}>Observations</label>
      <textarea style={{ ...inputStyle, height: "100px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <label style={labelStyle}>Reference Image</label>
      <input type="file" accept="image/*" onChange={handleFile} />
      <button onClick={handleSave} disabled={loading || !actor} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "2rem", cursor: "pointer", opacity: (!actor || loading) ? 0.5 : 1 }}>
        {loading ? "SAVING TO ICP..." : actor ? "SAVE RESEARCH" : "WAITING FOR CONNECTION..."}
      </button>
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
  
  const [dataList, setDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cvLink, setCvLink] = useState("");

  const loadData = useCallback(async (section: NavSection) => {
    if (!actor) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      let data: any[] = [];
      if (section === "art-portfolio") data = await actor.listAllArtItems();
      else if (section === "students-works") data = await actor.listAllStudentWorks();
      else if (section === "lectures") data = await actor.listAllLectures();
      else if (section === "research") data = await actor.listAllResearchItems();
      else if (section === "cv") {
         const link = await actor.getCvLink();
         setCvLink(link);
      }
      setDataList(data || []);
    } catch (e: any) { 
        console.warn("Section not yet available on backend");
        setDataList([]);
    } finally { setIsLoading(false); }
  }, [actor]);

  useEffect(() => { if (isAuthenticated && actor) loadData(activeSection); }, [activeSection, actor, isAuthenticated, loadData]);

  const handleToggleLive = async (id: bigint, current: boolean) => {
    if (!actor) return;
    try {
      if (activeSection === "art-portfolio") await actor.setArtItemLive(id, !current);
      else if (activeSection === "students-works") await actor.setStudentWorkLive(id, !current);
      loadData(activeSection);
    } catch (e: any) { console.error(e); }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor || !confirm("Delete this permanently?")) return;
    try {
      if (activeSection === "art-portfolio") await actor.deleteArtItem(id);
      else if (activeSection === "students-works") await actor.deleteStudentWork(id);
      loadData(activeSection);
    } catch (e: any) { console.error(e); }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#E5E0D8", fontFamily: "monospace" }}>
      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "#0c0c0c", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "3rem 2rem" }}>
          <p style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "24px", margin: 0 }}>Anthropocene</p>
          <p style={{ fontSize: "8px", opacity: 0.3, letterSpacing: "0.5em", marginTop: "10px", textTransform: "uppercase" }}>Interaction & Practice</p>
        </div>
        
        <nav style={{ flex: 1 }}>
          {[
            { id: "lectures", label: "Manage Lectures", icon: <BookOpen size={15} /> },
            { id: "students-works", label: "Manage Students Works", icon: <GalleryHorizontalEnd size={15} /> },
            { id: "art-portfolio", label: "Manage Art Portfolio", icon: <ImageIcon size={15} /> },
            { id: "design-portfolio", label: "Manage Design Portfolio", icon: <GalleryVerticalEnd size={15} /> },
            { id: "research", label: "Manage Research", icon: <Layers size={15} /> },
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
          <button onClick={() => { logout(); navigate({ to: "/admin" }); }} style={{ width: "100%", background: "none", color: "#444", border: "none", fontSize: "9px", cursor: "pointer" }}>SIGN OUT</button>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 200px", padding: "1.2rem 1.5rem", background: "#0c0c0c", borderBottom: "1px solid #1a1a1a", fontSize: "9px", color: "#444", letterSpacing: "0.2em" }}>
            <span>IDENTIFIER / TITLE</span>
            <span>VISIBILITY</span>
            <span>ACTIONS</span>
          </div>
          {isLoading ? <div style={{ padding: "5rem", textAlign: "center", fontSize: "11px", color: "#333" }}>SYNCHRONIZING WITH BLOCKCHAIN...</div> : 
            dataList.map((item: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 200px", padding: "1.5rem", borderBottom: "1px solid #0f0f0f", alignItems: "center", fontSize: "14px" }}>
                <span>{item.title || item.studentName}</span>
                <span style={{ fontSize: "9px", color: item.isLive ? "#4CAF50" : "#333" }}>{item.isLive ? "● LIVE" : "○ DRAFT"}</span>
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <button onClick={() => handleToggleLive(item.id, item.isLive)} style={{ background: "none", border: "1px solid #222", color: "#666", fontSize: "9px", padding: "5px 10px", cursor: "pointer" }}>TOGGLE</button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "1px solid #222", color: "#8C3A3A", fontSize: "9px", padding: "5px 10px", cursor: "pointer" }}>DELETE</button>
                </div>
              </div>
            ))
          }
          {!isLoading && dataList.length === 0 && <div style={{ padding: "6rem", textAlign: "center", color: "#1a1a1a", fontSize: "10px", letterSpacing: "0.5em" }}>NO RECORDS FOUND</div>}
        </div>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <>
            {activeSection === "art-portfolio" && <AddArtItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("art-portfolio")} actor={actor} />}
            {activeSection === "students-works" && <AddStudentWorkModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("students-works")} actor={actor} />}
            {activeSection === "lectures" && <AddLectureModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("lectures")} actor={actor} />}
            {activeSection === "research" && <AddResearchItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("research")} actor={actor} />}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
