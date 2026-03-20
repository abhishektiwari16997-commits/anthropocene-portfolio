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
  transition: "border-color 0.2s ease",
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
  lectures: { title: "Lectures", description: "Manage lecture cards and embedded Figma prototypes for WebEcology." },
  "students-works": { title: "Students Works", description: "Moderate student portfolio submissions from the design faculty." },
  "art-portfolio": { title: "Art Portfolio", description: "Manage art practice entries for the WebGL gallery." },
  "design-portfolio": { title: "Design Portfolio", description: "Manage curated design items and client projects." },
  research: { title: "Research", description: "Manage floating research cards — images, poems, and sketches." },
  cv: { title: "CV", description: "Update your Curriculum Vitae PDF or set a public portfolio link." },
};

// ─── SHARED UI COMPONENTS ───────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ width: "100%", maxWidth: "500px", background: "#1a1a1a", border: "1px solid #333", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "serif", fontStyle: "italic", fontWeight: 700, fontSize: "22px", color: "#E5E0D8", margin: 0 }}>{title}</h3>
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
    <button onClick={onClick} disabled={isSubmitting || disabled} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "1rem", border: "none", letterSpacing: "0.2em", fontSize: "10px", fontWeight: "bold", opacity: isSubmitting || disabled ? 0.5 : 1, cursor: "pointer", transition: "0.2s" }}>
      {isSubmitting ? "SYNCING WITH BLOCKCHAIN..." : "SAVE ENTRY"}
    </button>
  );
}

// ─── INDIVIDUAL MODAL FORMS ──────────────────────────────────────────────────

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
    if (!identity) return alert("Please connect Internet Identity first.");
    setSubmitting(true);
    try {
      await actor.addArtItem(title, img);
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };
  return (
    <ModalShell title="Add Art Practice" onClose={onClose}>
      <FormField label="Artwork Title" value={title} onChange={setTitle} />
      <label style={labelStyle}>Artwork Image</label>
      <input type="file" accept="image/*" onChange={handleFile} style={{ marginBottom: "1.5rem", fontSize: "11px" }} />
      {img && <img src={img} style={{ width: "100%", height: "150px", objectFit: "cover", marginBottom: "1.5rem", border: "1px solid #333" }} />}
      <SubmitButton onClick={handleSave} isSubmitting={submitting} />
    </ModalShell>
  );
}

function AddStudentWorkModal({ onClose, onSuccess, actor, identity }: any) {
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
      <FormField label="Student Name" value={name} onChange={setName} />
      <FormTextarea label="Project Narrative" value={desc} onChange={setDesc} />
      <label style={labelStyle}>Featured Image</label>
      <input type="file" accept="image/*" onChange={handleFile} style={{ marginBottom: "1.5rem", fontSize: "11px" }} />
      <SubmitButton onClick={handleSave} isSubmitting={submitting} />
    </ModalShell>
  );
}

function AddLectureModal({ onClose, onSuccess, actor }: any) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleSave = async () => {
    setSubmitting(true);
    try {
      await actor.addLecture(title, url, desc, "45 min", "");
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };
  return (
    <ModalShell title="Add Lecture" onClose={onClose}>
      <FormField label="Lecture Title" value={title} onChange={setTitle} />
      <FormField label="Figma URL" value={url} onChange={setUrl} />
      <FormTextarea label="Lecture Summary" value={desc} onChange={setDesc} />
      <SubmitButton onClick={handleSave} isSubmitting={submitting} />
    </ModalShell>
  );
}

function AddResearchItemModal({ onClose, onSuccess, actor }: any) {
  const [title, setTitle] = useState("");
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
      await actor.addResearchItem(title, desc, img);
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };
  return (
    <ModalShell title="Add Research Card" onClose={onClose}>
      <FormField label="Title" value={title} onChange={setTitle} />
      <FormTextarea label="Observations / Notes" value={desc} onChange={setDesc} />
      <input type="file" onChange={handleFile} style={{ marginBottom: "1.5rem" }} />
      <SubmitButton onClick={handleSave} isSubmitting={submitting} />
    </ModalShell>
  );
}

function AddDesignPortfolioModal({ onClose, onSuccess, actor }: any) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleSave = async () => {
    setSubmitting(true);
    try {
      await actor.addDesignPortfolio(title, client, "2024", [], "", "", "", "", "");
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };
  return (
    <ModalShell title="Add Design Entry" onClose={onClose}>
      <FormField label="Project Title" value={title} onChange={setTitle} />
      <FormField label="Client / Context" value={client} onChange={setClient} />
      <SubmitButton onClick={handleSave} isSubmitting={submitting} />
    </ModalShell>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────

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

  // Safe Loader - Keeps Sidebar active if one section fails
  const loadSection = useCallback(async (section: NavSection) => {
    if (!actor) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      if (section === "art-portfolio") {
        const d = await actor.listAllArtItems(); setArtItems(d);
      } else if (section === "lectures") {
        try { const d = await actor.listAllLectures(); setLectures(d); } 
        catch { setLectures([]); setLoadError("Lecture methods not deployed yet."); }
      } else if (section === "students-works") {
        try { const d = await actor.listAllStudentWorks(); setStudentWorks(d); } 
        catch { setStudentWorks([]); setLoadError("Student Work methods not deployed."); }
      } else if (section === "design-portfolio") {
        try { const d = await actor.listAllDesignPortfolio(); setDesignItems(d); } 
        catch { setDesignItems([]); setLoadError("Design Portfolio methods not deployed."); }
      } else if (section === "research") {
        try { const d = await actor.listAllResearchItems(); setResearchItems(d); } 
        catch { setResearchItems([]); setLoadError("Research methods not deployed."); }
      } else if (section === "cv") {
        try { const link = await actor.getCvLink(); setCvLink(link); } catch { setLoadError("CV methods not deployed."); }
      }
    } catch (e: any) {
      setLoadError("Canister communication error.");
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
    if (!actor || !confirm("Permanently delete this entry?")) return;
    try {
      if (activeSection === "art-portfolio") await actor.deleteArtItem(id);
      else if (activeSection === "students-works") await actor.deleteStudentWork(id);
      else if (activeSection === "research") await actor.deleteResearchItem(id);
      loadSection(activeSection);
    } catch (e: any) { alert(e.message); }
  };

  const handleCvUpdate = async () => {
    if (!actor) return;
    try { await actor.setCvLink(cvLink); alert("CV Updated"); } catch (e: any) { alert(e.message); }
  };

  if (!isAuthenticated) return null;

  const currentList = activeSection === "art-portfolio" ? artItems :
                    activeSection === "lectures" ? lectures :
                    activeSection === "students-works" ? studentWorks :
                    activeSection === "design-portfolio" ? designItems : researchItems;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#E5E0D8", fontFamily: "monospace" }}>
      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "#0f0f0f", borderRight: "1px solid #222", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "3rem 2rem" }}>
          <p style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "24px", margin: 0, letterSpacing: "-0.02em" }}>Mr. Anthropocene</p>
          <p style={{ fontSize: "8px", opacity: 0.3, letterSpacing: "0.5em", marginTop: "10px", textTransform: "uppercase" }}>Interaction & Art</p>
        </div>
        
        <nav style={{ flex: 1 }}>
          {[
            { id: "art-portfolio", label: "Art Portfolio", icon: <ImageIcon size={15} /> },
            { id: "design-portfolio", label: "Design Portfolio", icon: <GalleryVerticalEnd size={15} /> },
            { id: "students-works", label: "Student Works", icon: <GalleryHorizontalEnd size={15} /> },
            { id: "lectures", label: "Lectures", icon: <BookOpen size={15} /> },
            { id: "research", label: "Research", icon: <Layers size={15} /> },
            { id: "cv", label: "Manage CV", icon: <FileIcon size={15} /> },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id as NavSection)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 2rem", background: "transparent", border: "none", borderLeft: activeSection === item.id ? "4px solid #8C3A3A" : "4px solid transparent", opacity: activeSection === item.id ? 1 : 0.35, cursor: "pointer", color: "#E5E0D8", textAlign: "left", transition: "all 0.3s ease" }}>
              {item.icon} <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "2rem", borderTop: "1px solid #222" }}>
          <button onClick={() => iiLogin()} style={{ width: "100%", background: identity ? "#1a1a1a" : "#8C3A3A", color: "#fff", border: "1px solid #333", padding: "0.8rem", fontSize: "9px", cursor: "pointer", marginBottom: "1rem", letterSpacing: "0.1em" }}>
            {identity ? "BLOCKCHAIN: SECURED" : "CONNECT IDENTITY"}
          </button>
          <button onClick={() => { logout(); navigate({ to: "/admin" }); }} style={{ width: "100%", background: "none", color: "#555", border: "none", fontSize: "9px", cursor: "pointer", textTransform: "uppercase" }}>Terminate Session</button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main style={{ flex: 1, padding: "5rem", overflowY: "auto", background: "linear-gradient(to bottom, #000, #080808)" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem" }}>
          <div>
            <h1 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "42px", margin: 0, color: "#E5E0D8" }}>{SECTION_META[activeSection].title}</h1>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "10px", maxWidth: "500px", lineHeight: "1.6" }}>{SECTION_META[activeSection].description}</p>
          </div>
          {activeSection !== "cv" && (
            <button onClick={() => setShowAddModal(true)} style={{ background: "#8C3A3A", color: "#fff", border: "none", padding: "1rem 2.5rem", fontSize: "11px", cursor: "pointer", fontWeight: "bold", letterSpacing: "0.2em" }}>
              + NEW ENTRY
            </button>
          )}
        </header>

        {loadError && (
          <div style={{ background: "rgba(140,58,58,0.05)", border: "1px solid rgba(140,58,58,0.15)", color: "#8C3A3A", padding: "1.5rem", fontSize: "11px", marginBottom: "3rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <X size={14} /> {loadError}
          </div>
        )}

        {activeSection === "cv" ? (
          <div style={{ maxWidth: "600px", background: "#0a0a0a", padding: "3rem", border: "1px solid #1a1a1a" }}>
            <FormField label="CV Destination URL (Figma, Notion, or Hosted PDF)" value={cvLink} onChange={setCvLink} placeholder="https://..." />
            <button onClick={handleCvUpdate} style={{ background: "#8C3A3A", color: "#fff", padding: "1rem 2rem", border: "none", fontSize: "11px", marginTop: "1rem", cursor: "pointer" }}>UPDATE PUBLIC CV LINK</button>
          </div>
        ) : (
          <div style={{ background: "#050505", border: "1px solid #111" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 200px", padding: "1.2rem 1.5rem", background: "#0c0c0c", borderBottom: "1px solid #1a1a1a", fontSize: "9px", color: "#444", letterSpacing: "0.25em" }}>
              <span>ID / NAME</span>
              <span>VISIBILITY</span>
              <span>CONTROLS</span>
            </div>
            {isLoading ? <div style={{ padding: "5rem", textAlign: "center", fontSize: "11px", color: "#333", letterSpacing: "0.3em" }}>SYNCHRONIZING WITH ICP CANISTER...</div> : 
              currentList.map((item: any, i: number) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 200px", padding: "1.5rem", borderBottom: "1px solid #0f0f0f", alignItems: "center", fontSize: "14px", transition: "background 0.3s" }} onMouseEnter={e => e.currentTarget.style.background = "#0a0a0a"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: "#aaa" }}>{item.title || item.studentName}</span>
                  <span style={{ fontSize: "9px", color: item.isLive ? "#4CAF50" : "#333", fontWeight: "bold" }}>{item.isLive ? "● LIVE" : "○ DRAFT"}</span>
                  <div style={{ display: "flex", gap: "0.8rem" }}>
                    <button onClick={() => handleToggleLive(item.id, item.isLive)} style={{ background: "none", border: "1px solid #222", color: "#666", fontSize: "9px", padding: "5px 10px", cursor: "pointer" }}>TOGGLE</button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "1px solid #222", color: "#8C3A3A", fontSize: "9px", padding: "5px 10px", cursor: "pointer" }}>REMOVE</button>
                  </div>
                </div>
              ))
            }
            {!isLoading && currentList.length === 0 && <div style={{ padding: "6rem", textAlign: "center", color: "#1a1a1a", fontSize: "10px", letterSpacing: "0.5em" }}>NO RECORDS COMMITTED TO BLOCKCHAIN</div>}
          </div>
        )}
      </main>

      {/* MODAL DISPATCHER */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {activeSection === "art-portfolio" && <AddArtItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("art-portfolio")} actor={actor} isActorReady={isActorReady} identity={identity} />}
            {activeSection === "students-works" && <AddStudentWorkModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("students-works")} actor={actor} isActorReady={isActorReady} identity={identity} />}
            {activeSection === "lectures" && <AddLectureModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("lectures")} actor={actor} />}
            {activeSection === "research" && <AddResearchItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("research")} actor={actor} />}
            {activeSection === "design-portfolio" && <AddDesignPortfolioModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("design-portfolio")} actor={actor} />}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
