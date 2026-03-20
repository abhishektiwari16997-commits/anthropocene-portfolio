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

// ─── Utilities ────────────────────────────────────────────────────────────────

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

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ width: "100%", maxWidth: "480px", background: "#1a1a1a", border: "1px solid #333", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "serif", fontStyle: "italic", color: "#E5E0D8", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "gray" }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function AddLectureModal({ onClose, onSuccess, actor }: any) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!actor) return alert("Waiting for blockchain connection... Please wait 2 seconds.");
    setLoading(true);
    try {
      await actor.addLecture(title, url, desc, "40 min", "");
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Lecture" onClose={onClose}>
      <label style={labelStyle}>Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ height: '1rem' }} />
      <label style={labelStyle}>Figma URL</label>
      <input style={inputStyle} value={url} onChange={(e) => setUrl(e.target.value)} />
      <div style={{ height: '1rem' }} />
      <label style={labelStyle}>Description</label>
      <textarea style={{ ...inputStyle, height: "80px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "1.5rem", cursor: "pointer" }}>
        {loading ? "SAVING..." : "SAVE LECTURE"}
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
    if (!actor) return alert("Waiting for blockchain connection...");
    setLoading(true);
    try {
      await actor.addStudentWork(name, desc, img, "");
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Student Work" onClose={onClose}>
      <label style={labelStyle}>Student Name</label>
      <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      <div style={{ height: '1rem' }} />
      <label style={labelStyle}>Description</label>
      <textarea style={{ ...inputStyle, height: "80px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div style={{ height: '1rem' }} />
      <label style={labelStyle}>Image Asset</label>
      <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: '10px' }} />
      <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "1.5rem" }}>
        {loading ? "UPLOADING..." : "SAVE WORK"}
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
    if (!actor) return alert("Waiting for blockchain connection...");
    setLoading(true);
    try {
      await actor.addArtItem(title, img);
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Art Item" onClose={onClose}>
      <label style={labelStyle}>Artwork Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ height: '1rem' }} />
      <label style={labelStyle}>Artwork Image</label>
      <input type="file" accept="image/*" onChange={handleFile} />
      {img && <img src={img} style={{ width: "100%", height: "120px", objectFit: "cover", marginTop: "1rem", border: '1px solid #333' }} />}
      <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "1.5rem" }}>
        {loading ? "SAVING..." : "SAVE ARTWORK"}
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
    const file = e.target.files[0];
    if (file && file.size > MAX_FILE_SIZE) return alert("File too large (>2MB)");
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target?.result as string);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = async () => {
    // FIX FOR YOUR ERROR: This check prevents the "null" crash seen in Screenshot 2026-03-20 132403.png
    if (!actor) {
      alert("Still connecting to blockchain. Please wait a moment.");
      return;
    }
    setLoading(true);
    try {
      await actor.addResearchItem(title, desc, img);
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Research Card" onClose={onClose}>
      <label style={labelStyle}>Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ height: '1rem' }} />
      <label style={labelStyle}>Notes / Observations</label>
      <textarea style={{ ...inputStyle, height: "100px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div style={{ height: '1rem' }} />
      <label style={labelStyle}>Reference Image</label>
      <input type="file" accept="image/*" onChange={handleFile} />
      <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "1.5rem" }}>
        {loading ? "SAVING..." : "SAVE RESEARCH"}
      </button>
    </ModalShell>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

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
      setDataList(data || []);
    } catch (e: any) { 
        console.error(e);
        setLoadError("Could not load section data."); 
    } finally { setIsLoading(false); }
  }, [actor]);

  useEffect(() => { if (isAuthenticated && actor) loadData(activeSection); }, [activeSection, actor, isAuthenticated, loadData]);

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#E5E0D8", fontFamily: "monospace" }}>
      <aside style={{ width: "240px", background: "#111", borderRight: "1px solid #222", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "2rem 1.5rem" }}>
          <p style={{ fontFamily: "serif", fontSize: "20px", fontStyle: 'italic', margin: 0 }}>Anthropocene</p>
          <p style={{ fontSize: "8px", opacity: 0.3, letterSpacing: '0.3em', marginTop: '5px' }}>STUDIO DASHBOARD</p>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.5rem", background: "transparent", border: "none", borderLeft: activeSection === item.id ? "3px solid #8C3A3A" : "3px solid transparent", opacity: activeSection === item.id ? 1 : 0.4, cursor: "pointer", color: "#E5E0D8", textAlign: "left" }}>
              <span style={{ color: activeSection === item.id ? '#8C3A3A' : '#E5E0D8' }}>{item.icon}</span>
              <span style={{ fontSize: "10px", textTransform: "uppercase" }}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "1.5rem", borderTop: '1px solid #222' }}>
          <button onClick={() => iiLogin()} style={{ width: "100%", background: "#8C3A3A", color: "#fff", border: "none", padding: "0.7rem", fontSize: "10px", marginBottom: "1rem", cursor: 'pointer' }}>
            {identity ? "RE-AUTHENTICATE" : "CONNECT IDENTITY"}
          </button>
          <button onClick={() => { logout(); navigate({ to: "/admin" }); }} style={{ width: "100%", background: "none", color: "gray", border: "none", fontSize: "10px", cursor: 'pointer' }}>SIGN OUT</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "4rem", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: "3rem" }}>
          <div>
            <h1 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "36px", margin: 0 }}>{SECTION_META[activeSection].title}</h1>
            <p style={{ fontSize: "12px", color: "gray", marginTop: '5px' }}>{SECTION_META[activeSection].description}</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ background: "#8C3A3A", color: "#fff", border: "none", padding: "0.8rem 2.2rem", fontSize: "11px", cursor: 'pointer' }}>+ ADD NEW</button>
        </div>

        {loadError && <div style={{ background: 'rgba(140,58,58,0.1)', color: "#8C3A3A", padding: '1rem', marginBottom: "2rem", border: '1px solid #8C3A3A' }}>⚠ {loadError}</div>}

        <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", padding: "1rem", background: "#111", fontSize: "9px", color: "gray", letterSpacing: '0.1em' }}>
            <span>TITLE / NAME</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>
          {isLoading ? <p style={{ padding: "3rem", textAlign: "center", fontSize: '11px' }}>Syncing with Canister...</p> : 
            dataList.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", padding: "1.2rem 1rem", borderBottom: "1px solid #111", fontSize: "13px" }}>
                <span>{item.title || item.studentName}</span>
                <span style={{ fontSize: "9px", color: item.isLive ? "#4CAF50" : "#444" }}>{item.isLive ? "● LIVE" : "○ DRAFT"}</span>
                <button style={{ background: "none", border: "1px solid #333", color: "gray", fontSize: "9px", padding: '3px' }}>MANAGE</button>
              </div>
            ))
          }
          {!isLoading && dataList.length === 0 && <p style={{ padding: '4rem', textAlign: 'center', color: '#222', fontSize: '11px' }}>SECTION EMPTY</p>}
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

const navItems: { id: NavSection; label: string; icon: any }[] = [
  { id: "lectures", label: "Manage Lectures", icon: <BookOpen size={14} /> },
  { id: "students-works", label: "Manage Students Works", icon: <GalleryHorizontalEnd size={14} /> },
  { id: "art-portfolio", label: "Manage Art Portfolio", icon: <ImageIcon size={14} /> },
  { id: "design-portfolio", label: "Manage Design Portfolio", icon: <GalleryVerticalEnd size={14} /> },
  { id: "research", label: "Manage Research", icon: <Layers size={14} /> },
  { id: "cv", label: "Manage CV", icon: <FileIcon size={14} /> },
];
