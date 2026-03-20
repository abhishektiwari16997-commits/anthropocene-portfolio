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

// ─── Actor retry utilities ─────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

function isAuthError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("unauthorized") ||
    msg.includes("not registered") ||
    msg.includes("trap") ||
    msg.includes("forbidden") ||
    msg.includes("access denied")
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

function CursorReset() {
  const { setIsRevealed, setCursorLabel, setSuppressDefaultLabel } =
    useCursor();
  useEffect(() => {
    setIsRevealed(true);
    setCursorLabel("");
    setSuppressDefaultLabel(true);
    return () => {
      setCursorLabel("");
      setSuppressDefaultLabel(false);
    };
  }, [setIsRevealed, setCursorLabel, setSuppressDefaultLabel]);
  return null;
}

type NavSection =
  | "lectures"
  | "students-works"
  | "art-portfolio"
  | "design-portfolio"
  | "research"
  | "cv";

const navItems: {
  id: NavSection;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}[] = [
  {
    id: "lectures",
    label: "Manage Lectures",
    icon: <BookOpen size={13} strokeWidth={1.5} />,
    ocid: "admin.lectures.link",
  },
  {
    id: "students-works",
    label: "Manage Students Works",
    icon: <GalleryHorizontalEnd size={13} strokeWidth={1.5} />,
    ocid: "admin.students_works.link",
  },
  {
    id: "art-portfolio",
    label: "Manage Art Portfolio",
    icon: <ImageIcon size={13} strokeWidth={1.5} />,
    ocid: "admin.art_portfolio.link",
  },
  {
    id: "design-portfolio",
    label: "Manage Design Portfolio",
    icon: <GalleryVerticalEnd size={13} strokeWidth={1.5} />,
    ocid: "admin.design_portfolio.link",
  },
  {
    id: "research",
    label: "Manage Research",
    icon: <Layers size={13} strokeWidth={1.5} />,
    ocid: "admin.research.link",
  },
  {
    id: "cv",
    label: "Manage CV",
    icon: <FileIcon size={13} strokeWidth={1.5} />,
    ocid: "admin.cv.link",
  },
];

const SECTION_META: Record<NavSection, { title: string; description: string }> =
  {
    lectures: {
      title: "Lectures",
      description:
        "Manage lecture cards and embedded Figma prototypes for the WebEcology series.",
    },
    "students-works": {
      title: "Students Works",
      description:
        "Manage and moderate student portfolio submissions from the design faculty.",
    },
    "art-portfolio": {
      title: "Art Portfolio",
      description:
        "Manage art practice entries and gallery images for the WebGL gallery.",
    },
    "design-portfolio": {
      title: "Design Portfolio",
      description:
        "Manage curated design portfolio items including client work and self-initiated projects.",
    },
    research: {
      title: "Research",
      description:
        "Manage floating canvas research cards — images, poems, sketches, and thought fragments.",
    },
    cv: {
      title: "CV",
      description:
        "Upload your Curriculum Vitae PDF or set a CV link. This will appear on the public CV page.",
    },
  };

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
  boxSizing: "border-box" as const,
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

function ActorNotReadyBanner({
  onRetry,
  isActorFetching,
}: {
  onRetry: () => void;
  isActorFetching: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      style={{
        background: "rgba(229,224,216,0.04)",
        border: "1px solid rgba(229,224,216,0.1)",
        borderRadius: "0",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flexWrap: "wrap",
      }}
    >
      {isActorFetching ? (
        <Loader2
          size={11}
          strokeWidth={1.5}
          style={{
            color: "rgba(229,224,216,0.4)",
            flexShrink: 0,
            animation: "spin 1s linear infinite",
          }}
        />
      ) : (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "rgba(229,224,216,0.3)",
            flexShrink: 0,
            display: "inline-block",
          }}
        />
      )}
      <p
        style={{
          fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
          fontSize: "10px",
          letterSpacing: "0.06em",
          color: "rgba(229,224,216,0.55)",
          margin: 0,
          flex: 1,
          lineHeight: 1.5,
        }}
      >
        {isActorFetching
          ? "Setting up secure connection... please try again in a moment."
          : "Connection not ready — tap Retry to reconnect."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isActorFetching}
        style={{
          background: "none",
          border: "1px solid rgba(229,224,216,0.2)",
          borderRadius: "0",
          padding: "0.35rem 0.75rem",
          fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
          fontSize: "8px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(229,224,216,0.6)",
          cursor: "default",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          opacity: isActorFetching ? 0.5 : 1,
          transition: "border-color 0.2s, color 0.2s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isActorFetching) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "rgba(229,224,216,0.45)";
            el.style.color = "#E5E0D8";
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.borderColor = "rgba(229,224,216,0.2)";
          el.style.color = "rgba(229,224,216,0.6)";
        }}
      >
        <RefreshCw size={9} strokeWidth={1.5} />
        Retry
      </button>
    </motion.div>
  );
}

// ─── Modals (AddLecture, AddStudent, AddArt, AddDesign, AddResearch, ModalShell, FormField, FormTextarea, ErrorText, SubmitButton) ────────────────

function AddLectureModal({ onClose, onSuccess, actor, isActorReady, isActorFetching, onRetryActor }: any) {
  const [title, setTitle] = useState("");
  const [protoUrl, setProtoUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [duration, setDuration] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setPdfBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!actor || !isActorReady) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await actor.addLecture(title.trim(), protoUrl.trim(), desc.trim(), duration.trim(), pdfBase64);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to add lecture. Is the method supported on the backend?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add Lecture" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <AnimatePresence>
          {(!actor || !isActorReady) && <ActorNotReadyBanner onRetry={onRetryActor} isActorFetching={isActorFetching} />}
        </AnimatePresence>
        <FormField label="Title" value={title} onChange={setTitle} />
        <FormField label="Prototype URL" value={protoUrl} onChange={setProtoUrl} placeholder="https://..." />
        <FormTextarea label="Description" value={desc} onChange={setDesc} />
        <FormField label="Duration" value={duration} onChange={setDuration} placeholder="40 min · Live session" />
        <div>
          <span style={labelStyle}>PDF Attachment (optional)</span>
          <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfChange} style={{ display: "none" }} />
          <button type="button" onClick={() => pdfInputRef.current?.click()} style={{ width: "100%", background: "#111111", border: "1px solid rgba(229,224,216,0.15)", padding: "0.75rem 1rem", color: pdfFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)", textAlign: "left", fontSize: "12px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileIcon size={13} strokeWidth={1.5} />
            {pdfFileName || "Choose PDF..."}
          </button>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton onClick={handleSubmit} isSubmitting={isSubmitting} disabled={!actor || !isActorReady} />
      </div>
    </ModalShell>
  );
}

function AddStudentWorkModal({ onClose, onSuccess, actor, isActorReady, isActorFetching, onRetryActor }: any) {
  const [studentName, setStudentName] = useState("");
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoFileName, setPhotoFileName] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError("Photo too large (max 2MB)"); return; }
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { if (typeof ev.target?.result === "string") setPhotoDataUrl(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!studentName.trim()) { setError("Name required"); return; }
    if (!actor || !isActorReady) return;
    setIsSubmitting(true);
    try {
      await actor.addStudentWork(studentName.trim(), description.trim(), photoDataUrl, pdfBase64);
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message); } finally { setIsSubmitting(false); }
  };

  return (
    <ModalShell title="Add Student Work" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <FormField label="Student Name" value={studentName} onChange={setStudentName} />
        <FormTextarea label="Description" value={description} onChange={setDescription} />
        <button type="button" onClick={() => photoInputRef.current?.click()} style={{ width: "100%", background: "#111111", border: "1px solid rgba(229,224,216,0.15)", padding: "0.75rem 1rem", color: photoFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)", textAlign: "left" }}>
          {photoFileName || "Choose photo..."}
        </button>
        <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton onClick={handleSubmit} isSubmitting={isSubmitting} disabled={!actor || !isActorReady} />
      </div>
    </ModalShell>
  );
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function AddArtItemModal({ onClose, onSuccess, actor, isActorReady, isActorFetching, onRetryActor }: any) {
  const [title, setTitle] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError("Image too large (max 2MB)"); return; }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { if (typeof ev.target?.result === "string") setImageDataUrl(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !imageDataUrl) { setError("Title and image required."); return; }
    setIsSubmitting(true);
    try {
      await actor.addArtItem(title.trim(), imageDataUrl);
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message); } finally { setIsSubmitting(false); }
  };

  return (
    <ModalShell title="Add Art Item" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <FormField label="Title" value={title} onChange={setTitle} />
        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: "100%", background: "#111111", border: "1px solid rgba(229,224,216,0.15)", padding: "0.75rem 1rem", color: imageFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)", textAlign: "left" }}>
          {imageFileName || "Choose image..."}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton onClick={handleSubmit} isSubmitting={isSubmitting} disabled={!actor || !isActorReady} />
      </div>
    </ModalShell>
  );
}

function AddDesignPortfolioModal({ onClose, onSuccess, actor, isActorReady }: any) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [year, setYear] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title required"); return; }
    setIsSubmitting(true);
    try {
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      await actor.addDesignPortfolio(title.trim(), client.trim(), year.trim(), tagsArray, figmaUrl.trim(), imageDataUrl, videoUrl.trim(), description.trim(), pdfBase64);
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message); } finally { setIsSubmitting(false); }
  };

  return (
    <ModalShell title="Add Design Item" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <FormField label="Title" value={title} onChange={setTitle} />
        <FormField label="Client" value={client} onChange={setClient} />
        <FormField label="Year" value={year} onChange={setYear} />
        <FormTextarea label="Description" value={description} onChange={setDescription} />
        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton onClick={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </ModalShell>
  );
}

function AddResearchItemModal({ onClose, onSuccess, actor, isActorReady }: any) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try { await actor.addResearchItem(title, desc, imageDataUrl); onSuccess(); onClose(); } catch (e: any) { } finally { setIsSubmitting(false); }
  };
  return (
    <ModalShell title="Add Research" onClose={onClose}>
      <FormField label="Title" value={title} onChange={setTitle} />
      <FormTextarea label="Description" value={desc} onChange={setDesc} />
      <SubmitButton onClick={handleSubmit} isSubmitting={isSubmitting} />
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: any) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: any) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <motion.div ref={overlayRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} style={{ width: "100%", maxWidth: "460px", background: "#1a1a1a", border: "1px solid rgba(229,224,216,0.1)", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "serif", fontStyle: "italic", color: "#E5E0D8", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#E5E0D8" }}><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, value, onChange, placeholder }: any) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={labelStyle}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder }: any) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
    </div>
  );
}

function ErrorText({ children }: any) {
  return <p style={{ fontSize: "10px", color: "#8C3A3A", margin: "0.5rem 0" }}>{children}</p>;
}

function SubmitButton({ onClick, isSubmitting, disabled }: any) {
  return (
    <button onClick={onClick} disabled={isSubmitting || disabled} style={{ width: "100%", background: "#8C3A3A", color: "#E5E0D8", padding: "0.75rem", border: "none", opacity: isSubmitting || disabled ? 0.5 : 1 }}>
      {isSubmitting ? "Saving..." : "Save Entry"}
    </button>
  );
}

// ─── Sidebar & Row Components ──────────────────────────────────────────────────

function SidebarNavItem({ item, isActive, onClick }: any) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.7rem 1.5rem", background: "transparent", border: "none", borderLeft: isActive ? "3px solid #8C3A3A" : "3px solid transparent", opacity: isActive ? 1 : 0.45, textAlign: "left" }}>
      <span style={{ color: isActive ? "#8C3A3A" : "#E5E0D8" }}>{item.icon}</span>
      <span style={{ fontSize: "10px", color: "#E5E0D8", textTransform: "uppercase" }}>{item.label}</span>
    </button>
  );
}

function EntryRow({ id, title, isLive, type, rowIndex, onToggleLive, onDelete }: any) {
  const [loading, setLoading] = useState(false);
  const handleToggle = async () => { setLoading(true); try { await onToggleLive(id, !isLive); } finally { setLoading(false); } };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 140px", padding: "0.8rem 1rem", borderBottom: "1px solid rgba(229,224,216,0.05)", alignItems: "center" }}>
      <span style={{ fontSize: "11px", color: "#E5E0D8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      <span style={{ fontSize: "8px", color: isLive ? "#4CAF50" : "gray" }}>{isLive ? "LIVE" : "DRAFT"}</span>
      <span style={{ fontSize: "8px", color: "gray" }}>{type}</span>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={handleToggle} style={{ fontSize: "8px", background: "none", border: "1px solid gray", color: "#E5E0D8" }}>{isLive ? "Unlive" : "Go Live"}</button>
        <button onClick={() => onDelete(id)} style={{ fontSize: "8px", background: "none", border: "1px solid #8C3A3A", color: "#8C3A3A" }}>Del</button>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────

export function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();
  const { identity, login: iiLogin, isLoggingIn: isIILoggingIn, isInitializing: isIIInitializing } = useInternetIdentity();
  const { actor, isFetching: isActorFetching } = useActor();
  const isActorReady = !!actor && !isActorFetching;

  const [activeSection, setActiveSection] = useState<NavSection>("art-portfolio"); // Set Art as default to avoid crash
  const [showAddModal, setShowAddModal] = useState(false);
  const [needsIdentity, setNeedsIdentity] = useState(false);

  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [studentWorks, setStudentWorks] = useState<StudentWorkItem[]>([]);
  const [artItems, setArtItems] = useState<ArtPortfolioItem[]>([]);
  const [designItems, setDesignItems] = useState<DesignPortfolioItem[]>([]);
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => { if (!isAuthenticated) navigate({ to: "/admin" }); }, [isAuthenticated, navigate]);

  const loadSection = useCallback(async (section: NavSection) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (section === "lectures") {
        // Safe fetch for lectures
        try {
          const data = await withActorRetry(() => actor, (a) => a.listAllLectures());
          setLectures(data);
        } catch (e) {
          console.warn("Lectures not supported yet");
          setLectures([]);
        }
      } else if (section === "students-works") {
        const data = await withActorRetry(() => actor, (a) => a.listAllStudentWorks());
        setStudentWorks(data);
      } else if (section === "art-portfolio") {
        const data = await withActorRetry(() => actor, (a) => a.listAllArtItems());
        setArtItems(data);
      } else if (section === "design-portfolio") {
        const data = await withActorRetry(() => actor, (a) => a.listAllDesignPortfolio());
        setDesignItems(data);
      } else if (section === "research") {
        const data = await withActorRetry(() => actor, (a) => a.listAllResearchItems());
        setResearchItems(data);
      }
    } catch (e: any) {
      setLoadError(e.message || "Fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => { if (isAuthenticated && actor && !isActorFetching) loadSection(activeSection); }, [activeSection, isAuthenticated, actor, isActorFetching, loadSection]);

  const currentRows = (() => {
    if (activeSection === "lectures") return lectures.map(l => ({ id: l.id, title: l.title, isLive: l.isLive, type: "Lecture", onToggleLive: async (id: any, val: any) => { await actor?.setLectureLive(id, val); loadSection("lectures"); }, onDelete: async (id: any) => { await actor?.deleteLecture(id); loadSection("lectures"); } }));
    if (activeSection === "students-works") return studentWorks.map(w => ({ id: w.id, title: w.studentName, isLive: w.isLive, type: "Work", onToggleLive: async (id: any, val: any) => { await actor?.setStudentWorkLive(id, val); loadSection("students-works"); }, onDelete: async (id: any) => { await actor?.deleteStudentWork(id); loadSection("students-works"); } }));
    if (activeSection === "art-portfolio") return artItems.map(a => ({ id: a.id, title: a.title, isLive: a.isLive, type: "Art", onToggleLive: async (id: any, val: any) => { await actor?.setArtItemLive(id, val); loadSection("art-portfolio"); }, onDelete: async (id: any) => { await actor?.deleteArtItem(id); loadSection("art-portfolio"); } }));
    return [];
  })();

  const principalDisplay = identity ? `${identity.getPrincipal().toString().slice(0, 8)}...` : null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000", color: "#E5E0D8" }}>
      <aside style={{ width: "220px", background: "#1a1a1a", borderRight: "1px solid #333", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "10px", opacity: 0.5 }}>ADMIN PANEL</p>
          <p style={{ fontFamily: "serif", fontSize: "18px" }}>Anthropocene</p>
          {principalDisplay && <p style={{ fontSize: "8px", color: "#4CAF50" }}>● {principalDisplay}</p>}
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => <SidebarNavItem key={item.id} item={item} isActive={activeSection === item.id} onClick={() => setActiveSection(item.id)} />)}
        </nav>
        <div style={{ padding: "1rem" }}>
          <button onClick={() => iiLogin()} style={{ width: "100%", background: "#8C3A3A", color: "#fff", padding: "0.5rem", fontSize: "10px" }}>{identity ? "RE-AUTHENTICATE" : "CONNECT IDENTITY"}</button>
          <button onClick={() => logout()} style={{ width: "100%", background: "none", color: "gray", marginTop: "1rem", fontSize: "10px", border: "none" }}>SIGN OUT</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "28px", margin: 0 }}>{SECTION_META[activeSection].title}</h1>
            <p style={{ fontSize: "10px", color: "gray" }}>{SECTION_META[activeSection].description}</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ background: "#8C3A3A", color: "#fff", padding: "0.7rem 1.5rem", border: "none" }}>+ ADD NEW</button>
        </div>

        {loadError && <div style={{ color: "#8C3A3A", background: "rgba(140,58,58,0.1)", padding: "1rem", marginBottom: "1rem" }}>{loadError}</div>}

        <div style={{ background: "#111", border: "1px solid #222" }}>
          {currentRows.map((row, i) => <EntryRow key={i} {...row} rowIndex={i} />)}
          {currentRows.length === 0 && !isLoading && <p style={{ padding: "2rem", textAlign: "center", color: "gray" }}>No entries found.</p>}
        </div>
      </main>

      <AnimatePresence>
        {showAddModal && activeSection === "art-portfolio" && (
          <AddArtItemModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("art-portfolio")} actor={actor} isActorReady={isActorReady} />
        )}
        {showAddModal && activeSection === "lectures" && (
          <AddLectureModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("lectures")} actor={actor} isActorReady={isActorReady} />
        )}
        {showAddModal && activeSection === "students-works" && (
          <AddStudentWorkModal onClose={() => setShowAddModal(false)} onSuccess={() => loadSection("students-works")} actor={actor} isActorReady={isActorReady} />
        )}
      </AnimatePresence>
    </div>
  );
}
