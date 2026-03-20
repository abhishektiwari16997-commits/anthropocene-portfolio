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

type NavSection =
  | "lectures"
  | "students-works"
  | "art-portfolio"
  | "design-portfolio"
  | "research"
  | "cv";

const SECTION_META: Record<NavSection, { title: string; description: string }> = {
  lectures: { title: "Lectures", description: "Manage lecture cards and embedded Figma prototypes." },
  "students-works": { title: "Students Works", description: "Manage and moderate student portfolio submissions." },
  "art-portfolio": { title: "Art Portfolio", description: "Manage art practice entries for the WebGL gallery." },
  "design-portfolio": { title: "Design Portfolio", description: "Manage design portfolio items and client work." },
  research: { title: "Research", description: "Manage research cards, poems, and fragments." },
  cv: { title: "CV", description: "Update your Curriculum Vitae link or PDF." },
};

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

// ─── MODAL SHELL ──────────────────────────────────────────────────────────────

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

// ─── MODALS WITH AUTO-RETRY LOGIC ─────────────────────────────────────────────

function AddArtItemModal({ onClose, onSuccess, actor, identity }: any) {
  const [title, setTitle] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // AUTO-RETRY: If actor isn't ready, wait 1s and try again once automatically
    let currentActor = actor;
    if (!currentActor) {
      await delay(1000);
      currentActor = actor; 
    }
    
    if (!currentActor) {
      alert("Blockchain connection timed out. Please try one more time.");
      setLoading(false);
      return;
    }

    try {
      await currentActor.addArtItem(title, img);
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Art Practice" onClose={onClose}>
      <label style={labelStyle}>Artwork Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <input type="file" accept="image/*" onChange={(e:any) => {
        const r = new FileReader(); r.onload = (ev) => setImg(ev.target?.result as string); r.readAsDataURL(e.target.files[0]);
      }} />
      <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "2rem", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
        {loading ? "COMMITTING TO BLOCKCHAIN..." : "SAVE ARTWORK"}
      </button>
    </ModalShell>
  );
}

function AddStudentWorkModal({ onClose, onSuccess, actor, identity }: any) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    let currentActor = actor;
    if (!currentActor) { await delay(1000); currentActor = actor; }
    if (!currentActor) { alert("Connection Error. Please retry."); setLoading(false); return; }

    try {
      await currentActor.addStudentWork(name, desc, img, "");
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Student Work" onClose={onClose}>
      <label style={labelStyle}>Student Name</label>
      <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <label style={labelStyle}>Narrative</label>
      <textarea style={{ ...inputStyle, height: "100px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <input type="file" accept="image/*" onChange={(e:any) => {
        const r = new FileReader(); r.onload = (ev) => setImg(ev.target?.result as string); r.readAsDataURL(e.target.files[0]);
      }} />
      <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "2rem" }}>
        {loading ? "UPLOADING..." : "SAVE WORK"}
      </button>
    </ModalShell>
  );
}

function AddResearchItemModal({ onClose, onSuccess, actor, identity }: any) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    let currentActor = actor;
    // CRITICAL FIX: If actor is null, we wait 1.5 seconds automatically
    if (!currentActor) {
      await delay(1500);
      currentActor = actor;
    }

    if (!currentActor) {
      alert("Blockchain connection is still initializing. Please wait 2 seconds and try again.");
      setLoading(false);
      return;
    }

    try {
      await currentActor.addResearchItem(title, desc, img);
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <ModalShell title="Add Research Card" onClose={onClose}>
      <label style={labelStyle}>Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <label style={labelStyle}>Observations</label>
      <textarea style={{ ...inputStyle, height: "100px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div style={{ height: "1.25rem" }} />
      <input type="file" accept="image/*" onChange={(e:any) => {
        const r = new FileReader(); r.onload = (ev) => setImg(ev.target?.result as string); r.readAsDataURL(e.target.files[0]);
      }} />
      <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", marginTop: "2rem" }}>
        {loading ? "SYNCING..." : "SAVE RESEARCH"}
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

  const loadData = useCallback(async (section: NavSection) => {
    if (!actor) return;
    setIsLoading(true);
    try {
      let data: any[] = [];
      if (section === "art-portfolio") data = await actor.listAllArtItems();
      else if (section === "students-works") data = await actor.listAllStudentWorks();
      else if (section === "lectures") try { data = await actor.listAllLectures(); } catch { data = []; }
      else if (section === "research") try { data = await actor.listAllResearchItems(); } catch { data = []; }
      setDataList(data || []);
    } catch (e) { console.warn("Load failed"); } finally { setIsLoading(false); }
  }, [actor]);

  useEffect(() => { if (isAuthenticated && actor) loadData(activeSection); }, [activeSection, actor, isAuthenticated, loadData]);

  if (!isAuthenticated) return null;

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
          ].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id as NavSection)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1.1rem 2rem", background: "transparent", border: "none", borderLeft: activeSection === item.id ? "4px solid #8C3A3A" : "4px solid transparent", opacity: activeSection === item.id ? 1 : 0.3, cursor: "pointer", color: "#E5E0D8", textAlign: "left" }}>
              {item.icon} <span style={{ fontSize: "10px", textTransform: "uppercase" }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "2rem", borderTop: "1px solid #1a1a1a" }}>
          <button onClick={() => iiLogin()} style={{ width: "100%", background: identity ? "#151515" : "#8C3A3A", color: "#fff", border: "1px solid #333", padding: "0.8rem", fontSize: "9px", marginBottom: "1rem" }}>
            {identity ? "CONNECTED" : "CONNECT IDENTITY"}
          </button>
          <button onClick={() => logout()} style={{ width: "100%", background: "none", color: "#444", border: "none", fontSize: "9px" }}>SIGN OUT</button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main style={{ flex: 1, padding: "5rem", overflowY: "auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem" }}>
          <div>
            <h1 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "44px", margin: 0 }}>{SECTION_META[activeSection].title}</h1>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>{SECTION_META[activeSection].description}</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ background: "#8C3A3A", color: "#fff", border: "none", padding: "1.1rem 2.5rem", fontSize: "11px", fontWeight: "bold" }}>+ ADD NEW</button>
        </header>

        <div style={{ background: "#050505", border: "1px solid #111" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 200px", padding: "1.2rem 1.5rem", background: "#0c0c0c", borderBottom: "1px solid #1a1a1a", fontSize: "9px", color: "#444" }}>
            <span>IDENTIFIER / TITLE</span>
            <span>VISIBILITY</span>
            <span>ACTIONS</span>
          </div>
          {isLoading ? <div style={{ padding: "5rem", textAlign: "center", fontSize: "11px", color: "#333" }}>SYNCHRONIZING...</div> : 
            dataList.map((item: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 200px", padding: "1.5rem", borderBottom: "1px solid #0f0f0f", alignItems: "center", fontSize: "14px" }}>
                <span>{item.title || item.studentName}</span>
                <span style={{ fontSize: "9px", color: item.isLive ? "#4CAF50" : "#333" }}>{item.isLive ? "● LIVE" : "○ DRAFT"}</span>
                <button style={{ background: "none", border: "1px solid #222", color: "#666", fontSize: "9px", padding: "5px 10px" }}>MANAGE</button>
              </div>
            ))
          }
        </div>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <>
            {activeSection === "art-portfolio" && <AddArtItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("art-portfolio")} actor={actor} identity={identity} />}
            {activeSection === "students-works" && <AddStudentWorkModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("students-works")} actor={actor} identity={identity} />}
            {activeSection === "research" && <AddResearchItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadData("research")} actor={actor} identity={identity} />}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
