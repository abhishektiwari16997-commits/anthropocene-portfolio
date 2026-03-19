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

/** Waits ms milliseconds */
function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

/** Returns true if the error is an auth/authorization error that should NOT be retried */
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

/** Calls fn, retrying up to maxAttempts with exponential backoff if actor is not yet ready.
 *  Auth errors (unauthorized / not registered) are NOT retried — they fail immediately. */
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
        // Auth errors will never succeed with more retries — fail immediately
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

// ─── Input styles ─────────────────────────────────────────────────────────────

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

// ─── Actor not ready banner ────────────────────────────────────────────────────

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

// ─── Modal: Add Lecture ────────────────────────────────────────────────────────

function AddLectureModal({
  onClose,
  onSuccess,
  actor,
  isActorReady,
  isActorFetching,
  onRetryActor,
}: {
  onClose: () => void;
  onSuccess: () => void;
  actor: import("../backend.d").backendInterface | null;
  isActorReady: boolean;
  isActorFetching: boolean;
  onRetryActor: () => void;
}) {
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
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!actor || !isActorReady) {
      // Not an error — transient state, show banner instead
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await actor.addLecture(
        title.trim(),
        protoUrl.trim(),
        desc.trim(),
        duration.trim(),
        pdfBase64,
      );
      onSuccess();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to add lecture. Check admin permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add Lecture" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Actor not ready banner */}
        <AnimatePresence>
          {(!actor || !isActorReady) && (
            <ActorNotReadyBanner
              onRetry={onRetryActor}
              isActorFetching={isActorFetching}
            />
          )}
        </AnimatePresence>

        <FormField label="Title" value={title} onChange={setTitle} />
        <FormField
          label="Prototype URL"
          value={protoUrl}
          onChange={setProtoUrl}
          placeholder="https://..."
        />
        <FormTextarea label="Description" value={desc} onChange={setDesc} />
        <FormField
          label="Duration"
          value={duration}
          onChange={setDuration}
          placeholder="40 min · Live session"
        />

        {/* PDF uploader — optional */}
        <div>
          <span style={labelStyle}>PDF Attachment (optional)</span>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            data-ocid="admin.lecture.upload_button"
            onChange={handlePdfChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(229,224,216,0.15)",
              borderRadius: "0",
              padding: "0.75rem 1rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "12px",
              color: pdfFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)",
              outline: "none",
              cursor: "default",
              textAlign: "left",
              transition: "border-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.15)";
            }}
          >
            <FileIcon
              size={13}
              strokeWidth={1.5}
              style={{ flexShrink: 0, color: "rgba(229,224,216,0.4)" }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pdfFileName || "Choose PDF..."}
            </span>
          </button>
        </div>

        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton
          onClick={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!actor || !isActorReady}
        />
      </div>
    </ModalShell>
  );
}

// ─── Modal: Add Student Work ───────────────────────────────────────────────────

function AddStudentWorkModal({
  onClose,
  onSuccess,
  actor,
  isActorReady,
  isActorFetching,
  onRetryActor,
}: {
  onClose: () => void;
  onSuccess: () => void;
  actor: import("../backend.d").backendInterface | null;
  isActorReady: boolean;
  isActorFetching: boolean;
  onRetryActor: () => void;
}) {
  const [studentName, setStudentName] = useState("");
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [photoFileName, setPhotoFileName] = useState<string>("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("Photo is too large (max 2 MB). Please compress it first.");
      return;
    }
    setError(null);
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setPhotoDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

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
    if (!studentName.trim()) {
      setError("Student name is required.");
      return;
    }
    if (!actor || !isActorReady) {
      // Transient state — banner is shown, don't set a permanent error
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await actor.addStudentWork(
        studentName.trim(),
        description.trim(),
        photoDataUrl,
        pdfBase64,
      );
      onSuccess();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to add work. Check admin permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add Student Work" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Actor not ready banner */}
        <AnimatePresence>
          {(!actor || !isActorReady) && (
            <ActorNotReadyBanner
              onRetry={onRetryActor}
              isActorFetching={isActorFetching}
            />
          )}
        </AnimatePresence>

        <FormField
          label="Student Name"
          value={studentName}
          onChange={setStudentName}
          placeholder="e.g. Aisha Sharma"
        />
        <FormTextarea
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Brief description of the student's work..."
        />

        {/* ── Photo upload ── */}
        <div>
          <span style={labelStyle}>Student Photo (PNG / JPG)</span>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            data-ocid="admin.student.photo.upload_button"
            onChange={handlePhotoChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(229,224,216,0.15)",
              borderRadius: "0",
              padding: "0.75rem 1rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "12px",
              color: photoFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)",
              outline: "none",
              cursor: "default",
              textAlign: "left",
              transition: "border-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.15)";
            }}
          >
            <ImageIcon
              size={13}
              strokeWidth={1.5}
              style={{ flexShrink: 0, color: "rgba(229,224,216,0.4)" }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {photoFileName || "Choose photo..."}
            </span>
          </button>
          {/* Photo thumbnail preview */}
          {photoDataUrl && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                marginTop: "0.5rem",
                border: "1px solid rgba(229,224,216,0.1)",
                padding: "0.4rem 0.5rem",
                background: "#111111",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
              }}
            >
              <img
                src={photoDataUrl}
                alt="Preview"
                style={{
                  height: "60px",
                  width: "auto",
                  maxWidth: "80px",
                  objectFit: "cover",
                  display: "block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  color: "rgba(229,224,216,0.45)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {photoFileName}
              </span>
            </motion.div>
          )}
        </div>

        {/* ── PDF upload (prototype / work PDF) ── */}
        <div>
          <span style={labelStyle}>Prototype / Work PDF (optional)</span>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            data-ocid="admin.student.pdf.upload_button"
            onChange={handlePdfChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(229,224,216,0.15)",
              borderRadius: "0",
              padding: "0.75rem 1rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "12px",
              color: pdfFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)",
              outline: "none",
              cursor: "default",
              textAlign: "left",
              transition: "border-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.15)";
            }}
          >
            <FileIcon
              size={13}
              strokeWidth={1.5}
              style={{ flexShrink: 0, color: "rgba(229,224,216,0.4)" }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pdfFileName || "Choose PDF..."}
            </span>
          </button>
        </div>

        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton
          onClick={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!actor || !isActorReady}
        />
      </div>
    </ModalShell>
  );
}

// ─── Modal: Add Art Item ───────────────────────────────────────────────────────

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function AddArtItemModal({
  onClose,
  onSuccess,
  actor,
  isActorReady,
  isActorFetching,
  onRetryActor,
}: {
  onClose: () => void;
  onSuccess: () => void;
  actor: import("../backend.d").backendInterface | null;
  isActorReady: boolean;
  isActorFetching: boolean;
  onRetryActor: () => void;
}) {
  const [title, setTitle] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("Image is too large (max 2 MB). Please compress it first.");
      return;
    }

    setError(null);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setImageDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!imageDataUrl) {
      setError("Please select an image.");
      return;
    }
    if (!actor || !isActorReady) {
      // Transient state — banner is shown, don't set a permanent error
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await actor.addArtItem(title.trim(), imageDataUrl);
      onSuccess();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to add item. Check admin permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add Art Item" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Actor not ready banner */}
        <AnimatePresence>
          {(!actor || !isActorReady) && (
            <ActorNotReadyBanner
              onRetry={onRetryActor}
              isActorFetching={isActorFetching}
            />
          )}
        </AnimatePresence>

        <FormField label="Title" value={title} onChange={setTitle} />

        {/* File uploader */}
        <div>
          <span style={labelStyle}>Image File</span>

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            data-ocid="admin.add_entry.upload_button"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Styled trigger button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(229,224,216,0.15)",
              borderRadius: "0",
              padding: "0.75rem 1rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "12px",
              color: imageFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)",
              outline: "none",
              cursor: "default",
              textAlign: "left",
              transition: "border-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.15)";
            }}
          >
            <ImageIcon
              size={13}
              strokeWidth={1.5}
              style={{ flexShrink: 0, color: "rgba(229,224,216,0.4)" }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {imageFileName || "Choose image..."}
            </span>
          </button>
        </div>

        {/* Thumbnail preview */}
        {imageDataUrl && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              border: "1px solid rgba(229,224,216,0.1)",
              padding: "0.5rem",
              background: "#111111",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <img
              src={imageDataUrl}
              alt="Preview"
              style={{
                height: "80px",
                width: "auto",
                maxWidth: "100%",
                objectFit: "cover",
                display: "block",
                flexShrink: 0,
              }}
            />
            <div>
              <p
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(229,224,216,0.3)",
                  margin: "0 0 0.25rem",
                }}
              >
                Preview
              </p>
              <p
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "9px",
                  color: "rgba(229,224,216,0.55)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "180px",
                }}
              >
                {imageFileName}
              </p>
            </div>
          </motion.div>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton
          onClick={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!actor || !isActorReady}
        />
      </div>
    </ModalShell>
  );
}

// ─── Modal: Add Design Portfolio Item ─────────────────────────────────────────

function AddDesignPortfolioModal({
  onClose,
  onSuccess,
  actor,
  isActorReady,
  isActorFetching,
  onRetryActor,
}: {
  onClose: () => void;
  onSuccess: () => void;
  actor: import("../backend.d").backendInterface | null;
  isActorReady: boolean;
  isActorFetching: boolean;
  onRetryActor: () => void;
}) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [year, setYear] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  // Media inputs
  const [figmaUrl, setFigmaUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("Image is too large (max 2 MB). Please compress it first.");
      return;
    }
    setError(null);
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

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
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!actor || !isActorReady) {
      // Transient state — banner is shown, don't set a permanent error
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await actor.addDesignPortfolio(
        title.trim(),
        client.trim(),
        year.trim(),
        tagsArray,
        figmaUrl.trim(),
        imageDataUrl,
        videoUrl.trim(),
        description.trim(),
        pdfBase64,
      );
      onSuccess();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to add item. Check admin permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add Design Portfolio Item" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Actor not ready banner */}
        <AnimatePresence>
          {(!actor || !isActorReady) && (
            <ActorNotReadyBanner
              onRetry={onRetryActor}
              isActorFetching={isActorFetching}
            />
          )}
        </AnimatePresence>

        <FormField label="Title" value={title} onChange={setTitle} />
        <FormField label="Client" value={client} onChange={setClient} />
        <FormField
          label="Year"
          value={year}
          onChange={setYear}
          placeholder="2024"
        />
        <FormField
          label="Tags (comma-separated)"
          value={tags}
          onChange={setTags}
          placeholder="Identity, Print"
        />

        <FormTextarea
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Project description..."
        />

        {/* ── Media section separator ── */}
        <div
          style={{
            borderTop: "1px solid rgba(229,224,216,0.08)",
            paddingTop: "0.5rem",
          }}
        >
          <p
            style={{
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "8px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(229,224,216,0.28)",
              margin: "0 0 1rem",
            }}
          >
            Media — choose one (optional)
          </p>
        </div>

        {/* ── Figma URL ── */}
        <FormField
          label="Figma Prototype URL"
          value={figmaUrl}
          onChange={setFigmaUrl}
          placeholder="https://figma.site/..."
        />

        {/* ── Image upload ── */}
        <div>
          <span style={labelStyle}>Image File (PNG / JPG)</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            data-ocid="admin.design.upload_button"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(229,224,216,0.15)",
              borderRadius: "0",
              padding: "0.75rem 1rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "12px",
              color: imageFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)",
              outline: "none",
              cursor: "default",
              textAlign: "left",
              transition: "border-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.15)";
            }}
          >
            <ImageIcon
              size={13}
              strokeWidth={1.5}
              style={{ flexShrink: 0, color: "rgba(229,224,216,0.4)" }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {imageFileName || "Choose image..."}
            </span>
          </button>
          {imageDataUrl && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                marginTop: "0.5rem",
                border: "1px solid rgba(229,224,216,0.1)",
                padding: "0.4rem 0.5rem",
                background: "#111111",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
              }}
            >
              <img
                src={imageDataUrl}
                alt="Preview"
                style={{
                  height: "50px",
                  width: "auto",
                  maxWidth: "80px",
                  objectFit: "contain",
                  display: "block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  color: "rgba(229,224,216,0.45)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {imageFileName}
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Video URL ── */}
        <FormField
          label="Video URL (MP4)"
          value={videoUrl}
          onChange={setVideoUrl}
          placeholder="https://example.com/video.mp4"
        />

        {/* ── PDF attachment — optional ── */}
        <div>
          <span style={labelStyle}>PDF Attachment (optional)</span>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            data-ocid="admin.design.pdf.upload_button"
            onChange={handlePdfChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(229,224,216,0.15)",
              borderRadius: "0",
              padding: "0.75rem 1rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "12px",
              color: pdfFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)",
              outline: "none",
              cursor: "default",
              textAlign: "left",
              transition: "border-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.15)";
            }}
          >
            <FileIcon
              size={13}
              strokeWidth={1.5}
              style={{ flexShrink: 0, color: "rgba(229,224,216,0.4)" }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pdfFileName || "Choose PDF..."}
            </span>
          </button>
        </div>

        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton
          onClick={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!actor || !isActorReady}
        />
      </div>
    </ModalShell>
  );
}

// ─── Modal: Add Research Item ─────────────────────────────────────────────────

function AddResearchItemModal({
  onClose,
  onSuccess,
  actor,
  isActorReady,
  isActorFetching,
  onRetryActor,
}: {
  onClose: () => void;
  onSuccess: () => void;
  actor: import("../backend.d").backendInterface | null;
  isActorReady: boolean;
  isActorFetching: boolean;
  onRetryActor: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("Image is too large (max 2 MB). Please compress it first.");
      return;
    }

    setError(null);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setImageDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!imageDataUrl) {
      setError("Please select an image.");
      return;
    }
    if (!actor || !isActorReady) {
      // Transient state — banner is shown, don't set a permanent error
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await actor.addResearchItem(title.trim(), desc.trim(), imageDataUrl);
      onSuccess();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to add item. Check admin permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add Research Card" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Actor not ready banner */}
        <AnimatePresence>
          {(!actor || !isActorReady) && (
            <ActorNotReadyBanner
              onRetry={onRetryActor}
              isActorFetching={isActorFetching}
            />
          )}
        </AnimatePresence>

        <FormField label="Title" value={title} onChange={setTitle} />
        <FormTextarea label="Description" value={desc} onChange={setDesc} />

        {/* File uploader */}
        <div>
          <span style={labelStyle}>Image File (Figma PNG)</span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            data-ocid="admin.research.upload_button"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(229,224,216,0.15)",
              borderRadius: "0",
              padding: "0.75rem 1rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "12px",
              color: imageFileName ? "#E5E0D8" : "rgba(229,224,216,0.35)",
              outline: "none",
              cursor: "default",
              textAlign: "left",
              transition: "border-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(229,224,216,0.15)";
            }}
          >
            <ImageIcon
              size={13}
              strokeWidth={1.5}
              style={{ flexShrink: 0, color: "rgba(229,224,216,0.4)" }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {imageFileName || "Choose image..."}
            </span>
          </button>
        </div>

        {/* Thumbnail preview */}
        {imageDataUrl && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              border: "1px solid rgba(229,224,216,0.1)",
              padding: "0.5rem",
              background: "#111111",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <img
              src={imageDataUrl}
              alt="Preview"
              style={{
                height: "80px",
                width: "auto",
                maxWidth: "100%",
                objectFit: "cover",
                display: "block",
                flexShrink: 0,
              }}
            />
            <div>
              <p
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(229,224,216,0.3)",
                  margin: "0 0 0.25rem",
                }}
              >
                Preview
              </p>
              <p
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "9px",
                  color: "rgba(229,224,216,0.55)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "180px",
                }}
              >
                {imageFileName}
              </p>
            </div>
          </motion.div>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton
          onClick={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!actor || !isActorReady}
        />
      </div>
    </ModalShell>
  );
}

// ─── Shared Modal Primitives ───────────────────────────────────────────────────

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      data-ocid="admin.add_entry.dialog"
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#1a1a1a",
          border: "1px solid rgba(229,224,216,0.1)",
          borderRadius: "2px",
          padding: "2rem",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.75rem",
          }}
        >
          <h3
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "18px",
              color: "#E5E0D8",
              margin: 0,
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            data-ocid="admin.add_entry.close_button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "default",
              color: "rgba(229,224,216,0.4)",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#E5E0D8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(229,224,216,0.4)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {children}
      </motion.div>
    </motion.div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(229,224,216,0.45)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(229,224,216,0.15)";
        }}
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          ...inputStyle,
          resize: "vertical",
          lineHeight: "1.6",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(229,224,216,0.45)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(229,224,216,0.15)";
        }}
      />
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p
      data-ocid="admin.add_entry.error_state"
      style={{
        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
        fontSize: "10px",
        letterSpacing: "0.06em",
        color: "#8C3A3A",
        margin: 0,
        lineHeight: 1.6,
      }}
    >
      {children}
    </p>
  );
}

function SubmitButton({
  onClick,
  isSubmitting,
  disabled,
}: {
  onClick: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const isDisabled = isSubmitting || !!disabled;
  return (
    <button
      type="button"
      data-ocid="admin.add_entry.submit_button"
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        width: "100%",
        background:
          isHovering && !isDisabled
            ? "#a84444"
            : disabled
              ? "rgba(140,58,58,0.3)"
              : "#8C3A3A",
        border: "none",
        borderRadius: "0",
        padding: "0.875rem 1rem",
        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
        fontSize: "9px",
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "#E5E0D8",
        cursor: "default",
        transition: "background 0.2s ease",
        opacity: isDisabled ? 0.5 : 1,
        marginTop: "0.25rem",
      }}
    >
      {isSubmitting
        ? "Saving..."
        : disabled
          ? "Waiting for connection..."
          : "Save Entry"}
    </button>
  );
}

// ─── Sidebar nav item ──────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const active = isActive || isHovering;

  return (
    <button
      type="button"
      data-ocid={item.ocid}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.7rem 1.25rem 0.7rem 1.5rem",
        background: "transparent",
        border: "none",
        borderLeft: isActive ? "3px solid #8C3A3A" : "3px solid transparent",
        cursor: "default",
        transition:
          "border-color 0.2s ease, opacity 0.2s ease, padding 0.2s ease",
        opacity: active ? 1 : 0.45,
        paddingLeft: isActive ? "1.25rem" : "1.5rem",
        textAlign: "left",
      }}
    >
      <span
        style={{
          color: isActive ? "#8C3A3A" : "rgba(229,224,216,0.6)",
          transition: "color 0.2s ease",
          flexShrink: 0,
        }}
      >
        {item.icon}
      </span>
      <span
        style={{
          fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#E5E0D8",
          whiteSpace: "nowrap",
        }}
      >
        {item.label}
      </span>
    </button>
  );
}

// ─── Entry row ─────────────────────────────────────────────────────────────────

interface EntryRowProps {
  id: bigint;
  title: string;
  isLive: boolean;
  type: string;
  rowIndex: number;
  onToggleLive: (id: bigint, isLive: boolean) => Promise<void>;
  onDelete: (id: bigint) => Promise<void>;
}

function EntryRow({
  id,
  title,
  isLive,
  type,
  rowIndex,
  onToggleLive,
  onDelete,
}: EntryRowProps) {
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const handleToggleLive = async () => {
    setIsTogglingLive(true);
    setRowError(null);
    try {
      await onToggleLive(id, !isLive);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setRowError(null);
    try {
      await onDelete(id);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Delete failed.");
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      data-ocid={`admin.entries.row.${rowIndex}`}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.35,
        delay: (rowIndex - 1) * 0.06,
        ease: "easeOut",
      }}
      style={{
        borderBottom: "1px solid rgba(229,224,216,0.05)",
        transition: "background 0.15s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(229,224,216,0.025)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 100px 80px 140px",
          padding: "0.875rem 1rem",
          alignItems: "center",
        }}
      >
        {/* Title */}
        <span
          style={{
            fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
            fontSize: "11px",
            color: "rgba(229,224,216,0.65)",
            letterSpacing: "0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            paddingRight: "1rem",
          }}
        >
          {title}
        </span>

        {/* Status toggle */}
        <button
          type="button"
          data-ocid={`admin.entries.toggle.${rowIndex}`}
          onClick={handleToggleLive}
          disabled={isTogglingLive}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "default",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            opacity: isTogglingLive ? 0.5 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isLive ? "#4CAF50" : "rgba(229,224,216,0.2)",
              flexShrink: 0,
              transition: "background 0.2s ease",
            }}
          />
          <span
            style={{
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "8px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: isLive ? "#4CAF50" : "rgba(229,224,216,0.25)",
            }}
          >
            {isLive ? "Live" : "Draft"}
          </span>
        </button>

        {/* Type */}
        <span
          style={{
            fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
            fontSize: "8px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(229,224,216,0.2)",
          }}
        >
          {type}
        </span>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            data-ocid={`admin.entries.save_button.${rowIndex}`}
            onClick={handleToggleLive}
            disabled={isTogglingLive}
            style={{
              background: "none",
              border: "1px solid rgba(229,224,216,0.12)",
              padding: "0.25rem 0.6rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "7px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(229,224,216,0.5)",
              cursor: "default",
              borderRadius: "0",
              transition: "border-color 0.2s, color 0.2s",
              opacity: isTogglingLive ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "rgba(229,224,216,0.4)";
              el.style.color = "rgba(229,224,216,0.9)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "rgba(229,224,216,0.12)";
              el.style.color = "rgba(229,224,216,0.5)";
            }}
          >
            {isLive ? "Unlive" : "Go Live"}
          </button>
          <button
            type="button"
            data-ocid={`admin.entries.delete_button.${rowIndex}`}
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              background: "none",
              border: "1px solid rgba(140,58,58,0.18)",
              padding: "0.25rem 0.6rem",
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "7px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: isDeleting
                ? "rgba(140,58,58,0.3)"
                : "rgba(140,58,58,0.55)",
              cursor: "default",
              borderRadius: "0",
              transition: "border-color 0.2s, color 0.2s",
              opacity: isDeleting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "#8C3A3A";
                el.style.color = "#8C3A3A";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "rgba(140,58,58,0.18)";
              el.style.color = "rgba(140,58,58,0.55)";
            }}
          >
            {isDeleting ? "..." : "Del"}
          </button>
        </div>
      </div>

      {/* Inline error */}
      {rowError && (
        <div
          style={{
            padding: "0.4rem 1rem 0.6rem",
            fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
            fontSize: "9px",
            letterSpacing: "0.06em",
            color: "#8C3A3A",
            lineHeight: 1.5,
          }}
        >
          ⚠ {rowError}
        </div>
      )}
    </motion.div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();
  const {
    identity,
    login: iiLogin,
    isLoggingIn: isIILoggingIn,
    isInitializing: isIIInitializing,
  } = useInternetIdentity();
  const { actor, isFetching: isActorFetching } = useActor();
  const isActorReady = !!actor && !isActorFetching;
  const [activeSection, setActiveSection] = useState<NavSection>("lectures");
  const [isHoveringAdd, setIsHoveringAdd] = useState(false);
  const [isHoveringLogout, setIsHoveringLogout] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Track whether the user needs to connect Internet Identity to enable uploads
  const [needsIdentity, setNeedsIdentity] = useState(false);

  // Data state per section
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [studentWorks, setStudentWorks] = useState<StudentWorkItem[]>([]);
  const [artItems, setArtItems] = useState<ArtPortfolioItem[]>([]);
  const [designItems, setDesignItems] = useState<DesignPortfolioItem[]>([]);
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // CV link state (design-portfolio section)
  const [cvLinkInput, setCvLinkInput] = useState("");
  const [cvLinkSaving, setCvLinkSaving] = useState(false);
  const [cvLinkSaved, setCvLinkSaved] = useState(false);
  const [cvLinkError, setCvLinkError] = useState<string | null>(null);

  // CV PDF state (design-portfolio section)
  const [cvPdfBase64, setCvPdfBase64] = useState("");
  const [cvPdfFileName, setCvPdfFileName] = useState("");
  const [cvPdfAlreadySet, setCvPdfAlreadySet] = useState(false);
  const [cvPdfSaving, setCvPdfSaving] = useState(false);
  const [cvPdfSaved, setCvPdfSaved] = useState(false);
  const [cvPdfError, setCvPdfError] = useState<string | null>(null);
  const cvPdfInputRef = useRef<HTMLInputElement>(null);

  // Route protection — require local password session
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin" });
    }
  }, [isAuthenticated, navigate]);

  // Show a reconnect prompt if II initialization is done and we still have no identity.
  // Never auto-trigger the popup — that causes login loops. The user clicks the button.
  useEffect(() => {
    if (!isIIInitializing && !identity && isAuthenticated) {
      setNeedsIdentity(true);
    } else if (identity) {
      setNeedsIdentity(false);
    }
  }, [identity, isIIInitializing, isAuthenticated]);

  // Force reconnect: directly opens a fresh II popup.
  // We do NOT call iiClear() first — that triggers a full authClient re-init loop
  // which sets isIIInitializing=true for several seconds and disables the Add button.
  const forceReconnect = useCallback(() => {
    iiLogin();
  }, [iiLogin]);

  // Hard reset: wipes ALL II-related localStorage keys and reloads the page.
  const hardResetSession = useCallback(() => {
    try {
      // Remove all known II localStorage keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("ic-") ||
            key.startsWith("dfx-") ||
            key.includes("delegation") ||
            key.includes("identity") ||
            key.includes("auth-client"))
        ) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  }, []);

  const loadSection = useCallback(
    async (section: NavSection) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (section === "lectures") {
          const data = await withActorRetry(
            () => actor,
            (a) => a.listAllLectures(),
          );
          setLectures(data);
        } else if (section === "students-works") {
          const data = await withActorRetry(
            () => actor,
            (a) => a.listAllStudentWorks(),
          );
          setStudentWorks(data);
        } else if (section === "art-portfolio") {
          const data = await withActorRetry(
            () => actor,
            (a) => a.listAllArtItems(),
          );
          setArtItems(data);
        } else if (section === "design-portfolio") {
          const [data, link, pdf] = await withActorRetry(
            () => actor,
            (a) =>
              Promise.all([
                a.listAllDesignPortfolio(),
                a.getCvLink(),
                a.getCvPdf(),
              ]),
          );
          setDesignItems(data);
          setCvLinkInput(link?.trim() ?? "");
          setCvPdfAlreadySet(!!pdf?.trim());
        } else if (section === "research") {
          const data = await withActorRetry(
            () => actor,
            (a) => a.listAllResearchItems(),
          );
          setResearchItems(data);
        } else if (section === "cv") {
          const [link, pdf] = await withActorRetry(
            () => actor,
            (a) => Promise.all([a.getCvLink(), a.getCvPdf()]),
          );
          setCvLinkInput(link?.trim() ?? "");
          setCvPdfAlreadySet(!!pdf?.trim());
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to load data from backend.";
        const msgLower = msg.toLowerCase();
        if (
          msgLower.includes("unauthorized") ||
          msgLower.includes("not registered") ||
          msgLower.includes("trap")
        ) {
          // Auth error — show a clear message; the always-visible sidebar button handles reconnect
          setLoadError(
            "Identity expired — use the 'Reconnect Identity' button in the sidebar.",
          );
        } else if (
          msgLower.includes("not ready") ||
          msgLower.includes("actor not ready")
        ) {
          setLoadError(
            "Backend is warming up — please wait a moment and try again.",
          );
        } else {
          setLoadError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [actor],
  );

  useEffect(() => {
    // Load section as soon as the actor is ready — no identity required.
    // Content lists are readable by any authenticated actor (including anonymous).
    // Writes (uploads) still require II, which is enforced at the handler level.
    // isIIInitializing intentionally excluded — don't block data loading on II state.
    if (isAuthenticated && actor && !isActorFetching) {
      loadSection(activeSection);
    }
  }, [activeSection, isAuthenticated, actor, isActorFetching, loadSection]);

  // Retry handler — called from modal ActorNotReadyBanners
  const handleRetryActor = useCallback(() => {
    if (actor && !isActorFetching) {
      void loadSection(activeSection);
    }
  }, [actor, isActorFetching, loadSection, activeSection]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/admin" });
  };

  const handleSectionChange = (section: NavSection) => {
    setActiveSection(section);
    setShowAddModal(false);
  };

  // ── Handlers per section ──────────────────────────────────────────────────

  const handleToggleLecture = async (id: bigint, newLive: boolean) => {
    if (!actor) return;
    await actor.setLectureLive(id, newLive);
    const data = await actor.listAllLectures();
    setLectures(data);
  };

  const handleDeleteLecture = async (id: bigint) => {
    if (!actor) return;
    await actor.deleteLecture(id);
    const data = await actor.listAllLectures();
    setLectures(data);
  };

  const handleToggleStudentWork = async (id: bigint, newLive: boolean) => {
    if (!actor) return;
    await actor.setStudentWorkLive(id, newLive);
    const data = await actor.listAllStudentWorks();
    setStudentWorks(data);
  };

  const handleDeleteStudentWork = async (id: bigint) => {
    if (!actor) return;
    await actor.deleteStudentWork(id);
    const data = await actor.listAllStudentWorks();
    setStudentWorks(data);
  };

  const handleToggleArtItem = async (id: bigint, newLive: boolean) => {
    if (!actor) return;
    await actor.setArtItemLive(id, newLive);
    const data = await actor.listAllArtItems();
    setArtItems(data);
  };

  const handleDeleteArtItem = async (id: bigint) => {
    if (!actor) return;
    await actor.deleteArtItem(id);
    const data = await actor.listAllArtItems();
    setArtItems(data);
  };

  const handleToggleDesignItem = async (id: bigint, newLive: boolean) => {
    if (!actor) return;
    await actor.setDesignPortfolioLive(id, newLive);
    const data = await actor.listAllDesignPortfolio();
    setDesignItems(data);
  };

  const handleDeleteDesignItem = async (id: bigint) => {
    if (!actor) return;
    await actor.deleteDesignPortfolio(id);
    const data = await actor.listAllDesignPortfolio();
    setDesignItems(data);
  };

  const handleToggleResearchItem = async (id: bigint, newLive: boolean) => {
    if (!actor) return;
    await actor.setResearchItemLive(id, newLive);
    const data = await actor.listAllResearchItems();
    setResearchItems(data);
  };

  const handleDeleteResearchItem = async (id: bigint) => {
    if (!actor) return;
    await actor.deleteResearchItem(id);
    const data = await actor.listAllResearchItems();
    setResearchItems(data);
  };

  const handleSaveCvLink = async () => {
    if (!identity) {
      // No identity — trigger reconnect immediately instead of showing dead text
      forceReconnect();
      return;
    }
    setCvLinkSaving(true);
    setCvLinkError(null);
    setCvLinkSaved(false);
    try {
      const trimmed = cvLinkInput.trim();
      await withActorRetry(
        () => actor,
        (a) => a.setCvLink(trimmed),
      );
      setCvLinkSaved(true);
      setTimeout(() => setCvLinkSaved(false), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save CV link.";
      const msgLower = msg.toLowerCase();
      if (
        msgLower.includes("unauthorized") ||
        msgLower.includes("not registered") ||
        msgLower.includes("trap")
      ) {
        // Auth error — trigger reconnect popup, clear the error state
        setCvLinkError(null);
        forceReconnect();
      } else {
        setCvLinkError(msg);
      }
    } finally {
      setCvLinkSaving(false);
    }
  };

  const handleSaveCvPdf = async () => {
    if (!identity) {
      // No identity — trigger reconnect immediately instead of showing dead text
      forceReconnect();
      return;
    }
    if (!cvPdfBase64) {
      setCvPdfError("Please select a PDF file first.");
      return;
    }
    setCvPdfSaving(true);
    setCvPdfError(null);
    setCvPdfSaved(false);
    try {
      const pdfData = cvPdfBase64;
      await withActorRetry(
        () => actor,
        (a) => a.setCvPdf(pdfData),
      );
      setCvPdfSaved(true);
      setCvPdfAlreadySet(true);
      setTimeout(() => setCvPdfSaved(false), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save CV PDF.";
      const msgLower = msg.toLowerCase();
      if (
        msgLower.includes("unauthorized") ||
        msgLower.includes("not registered") ||
        msgLower.includes("trap")
      ) {
        // Auth error — trigger reconnect popup, clear the error state
        setCvPdfError(null);
        forceReconnect();
      } else {
        setCvPdfError(msg);
      }
    } finally {
      setCvPdfSaving(false);
    }
  };

  // ── Compute rows ──────────────────────────────────────────────────────────

  const currentMeta = SECTION_META[activeSection];

  const currentRows = (() => {
    if (activeSection === "lectures") {
      return lectures.map((l) => ({
        id: l.id,
        title: l.title,
        isLive: l.isLive,
        type: "Lecture",
        onToggleLive: handleToggleLecture,
        onDelete: handleDeleteLecture,
      }));
    }
    if (activeSection === "students-works") {
      return studentWorks.map((w) => ({
        id: w.id,
        title: w.studentName,
        isLive: w.isLive,
        type: "Work",
        onToggleLive: handleToggleStudentWork,
        onDelete: handleDeleteStudentWork,
      }));
    }
    if (activeSection === "art-portfolio") {
      return artItems.map((a) => ({
        id: a.id,
        title: a.title,
        isLive: a.isLive,
        type: "Image",
        onToggleLive: handleToggleArtItem,
        onDelete: handleDeleteArtItem,
      }));
    }
    if (activeSection === "design-portfolio") {
      return designItems.map((d) => ({
        id: d.id,
        title: d.title,
        isLive: d.isLive,
        type: "Design",
        onToggleLive: handleToggleDesignItem,
        onDelete: handleDeleteDesignItem,
      }));
    }
    if (activeSection === "research") {
      return researchItems.map((r) => ({
        id: r.id,
        title: r.title,
        isLive: r.isLive,
        type: "Research",
        onToggleLive: handleToggleResearchItem,
        onDelete: handleDeleteResearchItem,
      }));
    }
    if (activeSection === "cv") return [];
    return [];
  })();

  // Principal display
  const principalDisplay = identity
    ? `${identity.getPrincipal().toString().slice(0, 16)}...`
    : null;

  if (!isAuthenticated) return null;

  return (
    <div
      data-ocid="admin.dashboard.panel"
      style={{
        display: "flex",
        height: "100dvh",
        backgroundColor: "#000000",
        overflow: "hidden",
        cursor: "default",
        position: "relative",
      }}
    >
      <CursorReset />

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "220px",
          flexShrink: 0,
          backgroundColor: "#1a1a1a",
          borderRight: "1px solid rgba(229,224,216,0.06)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Sidebar top: brand label */}
        <div
          style={{
            padding: "1.75rem 1.5rem 1.25rem",
            borderBottom: "1px solid rgba(229,224,216,0.06)",
          }}
        >
          <p
            style={{
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "8px",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(229,224,216,0.3)",
              margin: "0 0 0.35rem",
            }}
          >
            Content Management
          </p>
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.04em",
              color: "#E5E0D8",
              margin: 0,
            }}
          >
            Anthropocene
          </p>
          {/* Identity indicator */}
          {principalDisplay ? (
            <p
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "7px",
                letterSpacing: "0.08em",
                color: "rgba(76,175,80,0.7)",
                margin: "0.5rem 0 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={identity?.getPrincipal().toString()}
            >
              ● {principalDisplay}
            </p>
          ) : (
            /* No identity — show reconnect button */
            <button
              type="button"
              data-ocid="admin.identity.reconnect_button"
              onClick={forceReconnect}
              disabled={isIILoggingIn}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                cursor: "default",
                marginTop: "0.5rem",
                opacity: isIILoggingIn ? 0.5 : 1,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isIILoggingIn) {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.8";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity =
                  isIILoggingIn ? "0.5" : "1";
              }}
            >
              <RefreshCw
                size={9}
                strokeWidth={1.5}
                style={{ color: "#8C3A3A", flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#8C3A3A",
                }}
              >
                {isIILoggingIn ? "Connecting..." : "Reconnect Identity"}
              </span>
            </button>
          )}
          {isActorFetching && (
            <p
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "7px",
                letterSpacing: "0.08em",
                color: "rgba(229,224,216,0.3)",
                margin: "0.5rem 0 0",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Loader2
                size={8}
                strokeWidth={1.5}
                style={{
                  animation: "spin 1s linear infinite",
                  flexShrink: 0,
                }}
              />
              Connecting to backend...
            </p>
          )}
        </div>

        {/* Nav items */}
        <nav
          aria-label="Admin navigation"
          style={{
            flex: 1,
            paddingTop: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.15rem",
          }}
        >
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              onClick={() => handleSectionChange(item.id)}
            />
          ))}
        </nav>

        {/* Sidebar bottom */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderTop: "1px solid rgba(229,224,216,0.06)",
          }}
        >
          <button
            type="button"
            data-ocid="admin.back.link"
            onClick={() => navigate({ to: "/" })}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "default",
              opacity: 0.35,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.35";
            }}
          >
            <FrameIcon size={11} color="#E5E0D8" strokeWidth={1.5} />
            <span
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "8px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#E5E0D8",
              }}
            >
              Back to site
            </span>
          </button>

          <button
            type="button"
            data-ocid="admin.logout.button"
            onClick={handleLogout}
            onMouseEnter={() => setIsHoveringLogout(true)}
            onMouseLeave={() => setIsHoveringLogout(false)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "default",
              marginTop: "0.75rem",
              opacity: isHoveringLogout ? 1 : 0.35,
              transition: "opacity 0.2s ease",
            }}
          >
            <LogOut size={11} color="#8C3A3A" strokeWidth={1.5} />
            <span
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "8px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#8C3A3A",
              }}
            >
              Sign out
            </span>
          </button>

          {/* ── Always-visible Internet Identity auth buttons ── */}
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(229,224,216,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <p
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "7px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.2)",
                margin: "0 0 0.4rem",
              }}
            >
              Internet Identity
            </p>

            {/* Reconnect Identity button — always visible */}
            <button
              type="button"
              data-ocid="admin.identity.reconnect_button"
              onClick={forceReconnect}
              disabled={isIILoggingIn}
              style={{
                width: "100%",
                background: identity
                  ? "rgba(229,224,216,0.04)"
                  : "rgba(140,58,58,0.15)",
                border: identity
                  ? "1px solid rgba(229,224,216,0.12)"
                  : "1px solid rgba(140,58,58,0.4)",
                borderRadius: "0",
                padding: "0.6rem 0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                cursor: "default",
                transition: "background 0.2s, border-color 0.2s, opacity 0.2s",
                opacity: isIILoggingIn ? 0.55 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isIILoggingIn) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    identity
                      ? "rgba(229,224,216,0.08)"
                      : "rgba(140,58,58,0.25)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  identity ? "rgba(229,224,216,0.04)" : "rgba(140,58,58,0.15)";
              }}
            >
              {isIILoggingIn ? (
                <Loader2
                  size={9}
                  strokeWidth={1.5}
                  style={{
                    color: "#8C3A3A",
                    animation: "spin 1s linear infinite",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <RefreshCw
                  size={9}
                  strokeWidth={1.5}
                  style={{
                    color: identity ? "rgba(229,224,216,0.5)" : "#8C3A3A",
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: identity ? "rgba(229,224,216,0.55)" : "#8C3A3A",
                }}
              >
                {isIILoggingIn
                  ? "Opening..."
                  : identity
                    ? "Re-authenticate"
                    : "Reconnect Identity"}
              </span>
            </button>

            {/* Hard Reset Session button — always visible */}
            <button
              type="button"
              data-ocid="admin.identity.hard_reset_button"
              onClick={hardResetSession}
              style={{
                width: "100%",
                background: "none",
                border: "1px solid rgba(229,224,216,0.08)",
                borderRadius: "0",
                padding: "0.5rem 0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                cursor: "default",
                transition: "border-color 0.2s, opacity 0.2s",
                opacity: 0.45,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.opacity = "0.8";
                el.style.borderColor = "rgba(229,224,216,0.2)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.opacity = "0.45";
                el.style.borderColor = "rgba(229,224,216,0.08)";
              }}
            >
              <X
                size={9}
                strokeWidth={1.5}
                style={{ color: "rgba(229,224,216,0.5)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "7px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(229,224,216,0.5)",
                }}
              >
                Hard Reset Session
              </span>
            </button>
          </div>

          <p
            style={{
              fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
              fontSize: "7px",
              letterSpacing: "0.15em",
              color: "rgba(229,224,216,0.15)",
              margin: "1rem 0 0",
            }}
          >
            v1.0 · ICP Backend
          </p>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
        style={{
          flex: 1,
          backgroundColor: "#000000",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: "1.5rem 3rem",
            borderBottom: "1px solid rgba(229,224,216,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "8px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.25)",
                margin: "0 0 0.3rem",
              }}
            >
              Anthropocene — Control Panel
            </p>
            <h1
              onDoubleClick={() =>
                window.dispatchEvent(new Event(STEALTH_TRIGGER_EVENT))
              }
              title=""
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: "italic",
                fontWeight: 800,
                fontSize: "clamp(20px, 2.5vw, 28px)",
                color: "#E5E0D8",
                margin: 0,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                cursor: "default",
                userSelect: "none",
              }}
            >
              Anthropocene Control Panel
            </h1>
          </div>

          {/* Add New Entry button — hidden for CV section (settings-only) */}
          {activeSection !== "cv" &&
            (() => {
              const canAdd = isActorReady && !isIIInitializing;
              return (
                <button
                  type="button"
                  data-ocid="admin.add_entry.primary_button"
                  onClick={() => {
                    if (canAdd) setShowAddModal(true);
                  }}
                  disabled={!canAdd}
                  onMouseEnter={() => {
                    if (canAdd) setIsHoveringAdd(true);
                  }}
                  onMouseLeave={() => setIsHoveringAdd(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background:
                      isActorFetching || isIIInitializing
                        ? "rgba(140,58,58,0.4)"
                        : isHoveringAdd && canAdd
                          ? "#a84444"
                          : "#8C3A3A",
                    border: "none",
                    borderRadius: "0",
                    padding: "0.75rem 1.5rem",
                    fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                    fontSize: "9px",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "#E5E0D8",
                    cursor: "default",
                    transition: "background 0.2s ease",
                    flexShrink: 0,
                    opacity: !canAdd ? 0.6 : 1,
                  }}
                >
                  {isActorFetching || isIIInitializing ? (
                    <Loader2
                      size={12}
                      strokeWidth={2}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Plus size={12} strokeWidth={2} />
                  )}
                  {isActorFetching || isIIInitializing
                    ? "Connecting..."
                    : "Add New Entry"}
                </button>
              );
            })()}
        </div>

        {/* II initializing overlay — shown while checking localStorage for saved session */}
        <AnimatePresence>
          {isIIInitializing && isAuthenticated && (
            <motion.div
              data-ocid="admin.identity.loading_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: "#1a1a1a",
                borderBottom: "1px solid rgba(229,224,216,0.06)",
                padding: "0.75rem 3rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexShrink: 0,
              }}
            >
              <Loader2
                size={10}
                strokeWidth={1.5}
                style={{
                  color: "rgba(229,224,216,0.4)",
                  animation: "spin 1s linear infinite",
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  color: "rgba(229,224,216,0.45)",
                  margin: 0,
                }}
              >
                Restoring your session...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Internet Identity banner — shown when session has genuinely expired */}
        <AnimatePresence>
          {needsIdentity && !isIIInitializing && (
            <motion.div
              data-ocid="admin.identity.banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                backgroundColor: "#1a1a1a",
                borderBottom: "1px solid rgba(140,58,58,0.25)",
                padding: "0.875rem 3rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#8C3A3A",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <p
                  style={{
                    fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    color: "#E5E0D8",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Your session has expired — click to reconnect and restore
                  admin access.
                </p>
              </div>
              <button
                type="button"
                data-ocid="admin.identity.connect_button"
                onClick={forceReconnect}
                disabled={isIILoggingIn}
                style={{
                  background: isIILoggingIn ? "rgba(140,58,58,0.5)" : "#8C3A3A",
                  border: "none",
                  borderRadius: "0",
                  padding: "0.5rem 1.25rem",
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "9px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "#E5E0D8",
                  cursor: "default",
                  transition: "background 0.2s ease",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  opacity: isIILoggingIn ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isIILoggingIn) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#a84444";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isIILoggingIn) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#8C3A3A";
                  }
                }}
              >
                {isIILoggingIn ? "Opening..." : "Reconnect Identity"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div
          style={{
            flex: 1,
            padding: "2.5rem 3rem",
            overflowY: "auto",
          }}
        >
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <h2
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 700,
                  fontSize: "clamp(22px, 2.2vw, 30px)",
                  color: "#E5E0D8",
                  margin: 0,
                  letterSpacing: "-0.015em",
                }}
              >
                {currentMeta.title}
              </h2>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  color: "rgba(229,224,216,0.3)",
                }}
              >
                {isLoading ? "loading..." : `${currentRows.length} entries`}
              </span>
            </div>

            <p
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "rgba(229,224,216,0.38)",
                marginBottom: "2.5rem",
                maxWidth: "480px",
                lineHeight: 1.7,
              }}
            >
              {currentMeta.description}
            </p>

            {/* CV Settings */}
            {activeSection === "cv" && (
              <div
                style={{
                  paddingBottom: "2rem",
                  marginBottom: "2rem",
                  borderBottom: "1px solid rgba(229,224,216,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <p
                  style={{
                    fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                    fontSize: "9px",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(229,224,216,0.45)",
                    margin: 0,
                  }}
                >
                  CV Settings
                </p>

                {/* CV Link / URL subsection */}
                <div>
                  <span style={labelStyle}>CV Link / File URL</span>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="text"
                      data-ocid="admin.cv.input"
                      value={cvLinkInput}
                      onChange={(e) => setCvLinkInput(e.target.value)}
                      placeholder="https://figma.site/... or https://..."
                      style={{ ...inputStyle, flex: "1 1 300px" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(229,224,216,0.45)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(229,224,216,0.15)";
                      }}
                    />
                    <button
                      type="button"
                      data-ocid="admin.cv.save_button"
                      onClick={handleSaveCvLink}
                      disabled={cvLinkSaving}
                      style={{
                        background: "#8C3A3A",
                        border: "none",
                        borderRadius: "0",
                        padding: "0.75rem 1.25rem",
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "9px",
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        color: "#E5E0D8",
                        cursor: "default",
                        transition: "background 0.2s ease",
                        opacity: cvLinkSaving ? 0.6 : 1,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!cvLinkSaving) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#a84444";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "#8C3A3A";
                      }}
                    >
                      {cvLinkSaving ? "Saving..." : "Save CV Link"}
                    </button>
                  </div>
                  {cvLinkSaved && (
                    <p
                      data-ocid="admin.cv.success_state"
                      style={{
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        color: "#4CAF50",
                        margin: "0.6rem 0 0",
                      }}
                    >
                      Saved.
                    </p>
                  )}
                  {cvLinkError && (
                    <p
                      data-ocid="admin.cv.error_state"
                      style={{
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "9px",
                        letterSpacing: "0.06em",
                        color: "#8C3A3A",
                        margin: "0.6rem 0 0",
                        lineHeight: 1.6,
                      }}
                    >
                      ⚠ {cvLinkError}
                    </p>
                  )}
                </div>

                {/* CV PDF Upload subsection */}
                <div>
                  <span style={labelStyle}>CV PDF Upload</span>
                  {cvPdfAlreadySet && (
                    <p
                      style={{
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        color: "#4CAF50",
                        margin: "0 0 0.75rem",
                      }}
                    >
                      ✓ PDF already uploaded — uploading a new one will replace
                      it.
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      ref={cvPdfInputRef}
                      type="file"
                      accept="application/pdf"
                      data-ocid="admin.cv.upload_button"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCvPdfFileName(file.name);
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result;
                          if (typeof result === "string")
                            setCvPdfBase64(result);
                        };
                        reader.readAsDataURL(file);
                      }}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => cvPdfInputRef.current?.click()}
                      style={{
                        flex: "1 1 200px",
                        background: "#111111",
                        border: "1px solid rgba(229,224,216,0.15)",
                        borderRadius: "0",
                        padding: "0.75rem 1rem",
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "12px",
                        color: cvPdfFileName
                          ? "#E5E0D8"
                          : "rgba(229,224,216,0.35)",
                        outline: "none",
                        cursor: "default",
                        textAlign: "left",
                        transition: "border-color 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "rgba(229,224,216,0.45)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "rgba(229,224,216,0.15)";
                      }}
                    >
                      <FileIcon
                        size={13}
                        strokeWidth={1.5}
                        style={{
                          flexShrink: 0,
                          color: "rgba(229,224,216,0.4)",
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cvPdfFileName || "Choose PDF..."}
                      </span>
                    </button>
                    <button
                      type="button"
                      data-ocid="admin.cv.pdf.save_button"
                      onClick={handleSaveCvPdf}
                      disabled={cvPdfSaving || !cvPdfBase64}
                      style={{
                        background: "#8C3A3A",
                        border: "none",
                        borderRadius: "0",
                        padding: "0.75rem 1.25rem",
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "9px",
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        color: "#E5E0D8",
                        cursor: "default",
                        transition: "background 0.2s ease",
                        opacity: cvPdfSaving || !cvPdfBase64 ? 0.5 : 1,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!cvPdfSaving && cvPdfBase64) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#a84444";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "#8C3A3A";
                      }}
                    >
                      {cvPdfSaving ? "Saving..." : "Save CV PDF"}
                    </button>
                  </div>
                  {cvPdfSaved && (
                    <p
                      data-ocid="admin.cv.pdf.success_state"
                      style={{
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        color: "#4CAF50",
                        margin: "0.6rem 0 0",
                      }}
                    >
                      PDF saved.
                    </p>
                  )}
                  {cvPdfError && (
                    <p
                      data-ocid="admin.cv.pdf.error_state"
                      style={{
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "9px",
                        letterSpacing: "0.06em",
                        color: "#8C3A3A",
                        margin: "0.6rem 0 0",
                        lineHeight: 1.6,
                      }}
                    >
                      ⚠ {cvPdfError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Load error */}
            {loadError && (
              <div
                data-ocid="admin.entries.error_state"
                style={{
                  padding: "1rem",
                  background: "rgba(140,58,58,0.08)",
                  border: "1px solid rgba(140,58,58,0.2)",
                  marginBottom: "1.5rem",
                  fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  color: "#8C3A3A",
                  lineHeight: 1.6,
                }}
              >
                ⚠ {loadError}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div
                data-ocid="admin.entries.loading_state"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    style={{
                      height: "48px",
                      background: "rgba(229,224,216,0.03)",
                      borderRadius: "0",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Table */}
            {!isLoading && (
              <div
                data-ocid="admin.entries.list"
                style={{ display: "flex", flexDirection: "column", gap: "0" }}
              >
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 80px 140px",
                    padding: "0.6rem 1rem",
                    borderBottom: "1px solid rgba(229,224,216,0.08)",
                  }}
                >
                  {["Title", "Status", "Type", "Actions"].map((col) => (
                    <span
                      key={col}
                      style={{
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "8px",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: "rgba(229,224,216,0.25)",
                      }}
                    >
                      {col}
                    </span>
                  ))}
                </div>

                {/* Entry rows */}
                {currentRows.map((row, i) => (
                  <EntryRow
                    key={Number(row.id)}
                    id={row.id}
                    title={row.title}
                    isLive={row.isLive}
                    type={row.type}
                    rowIndex={i + 1}
                    onToggleLive={row.onToggleLive}
                    onDelete={row.onDelete}
                  />
                ))}

                {/* Empty state */}
                {currentRows.length === 0 && !isLoading && (
                  <div
                    data-ocid="admin.entries.empty_state"
                    style={{
                      padding: "3rem 1rem",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                        fontSize: "10px",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "rgba(229,224,216,0.18)",
                        margin: 0,
                      }}
                    >
                      No entries yet — add one above
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer hint */}
            <p
              style={{
                fontFamily: '"JetBrains Mono", "Geist Mono", monospace',
                fontSize: "8px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(229,224,216,0.1)",
                marginTop: "2rem",
                textAlign: "right",
              }}
            >
              Authenticated via ICP · Internet Identity
            </p>
          </motion.div>
        </div>
      </motion.main>

      {/* ── Add Entry Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {activeSection === "lectures" && (
              <AddLectureModal
                onClose={() => setShowAddModal(false)}
                onSuccess={() => loadSection("lectures")}
                actor={actor}
                isActorReady={isActorReady}
                isActorFetching={isActorFetching}
                onRetryActor={handleRetryActor}
              />
            )}
            {activeSection === "students-works" && (
              <AddStudentWorkModal
                onClose={() => setShowAddModal(false)}
                onSuccess={() => loadSection("students-works")}
                actor={actor}
                isActorReady={isActorReady}
                isActorFetching={isActorFetching}
                onRetryActor={handleRetryActor}
              />
            )}
            {activeSection === "art-portfolio" && (
              <AddArtItemModal
                onClose={() => setShowAddModal(false)}
                onSuccess={() => loadSection("art-portfolio")}
                actor={actor}
                isActorReady={isActorReady}
                isActorFetching={isActorFetching}
                onRetryActor={handleRetryActor}
              />
            )}
            {activeSection === "design-portfolio" && (
              <AddDesignPortfolioModal
                onClose={() => setShowAddModal(false)}
                onSuccess={() => loadSection("design-portfolio")}
                actor={actor}
                isActorReady={isActorReady}
                isActorFetching={isActorFetching}
                onRetryActor={handleRetryActor}
              />
            )}
            {activeSection === "research" && (
              <AddResearchItemModal
                onClose={() => setShowAddModal(false)}
                onSuccess={() => loadSection("research")}
                actor={actor}
                isActorReady={isActorReady}
                isActorFetching={isActorFetching}
                onRetryActor={handleRetryActor}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
