"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Lock, Download } from "lucide-react";

interface ResourceViewerProps {
  resourceId: string;
  mimeType: string;
  title: string;
  userName?: string; // for watermark
}

export function ResourceViewer({ 
  resourceId, 
  mimeType, 
  title, 
  userName = "Étudiant",
  type: resourceType // Assuming we pass the 'type' from DB
}: ResourceViewerProps & { type?: string }) {
  const streamUrl = `/api/paid-resources/stream/${resourceId}`;

  const isPdf = mimeType === "application/pdf" || resourceType === "PDF";
  const isImage = mimeType.startsWith("image/") || resourceType === "IMAGE";
  const isVideo = mimeType.startsWith("video/") || resourceType === "VIDEO";

  // ── PDF ─────────────────────────────────────────────────────────────────────
  if (isPdf) {
    return (
      <SecureFrame
        src={streamUrl}
        title={title}
        userName={userName}
        type="pdf"
      />
    );
  }

  // ── VIDEO ────────────────────────────────────────────────────────────────────
  if (isVideo) {
    return (
      <div
        className="relative select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <video
          src={streamUrl}
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          playsInline
          className="w-full rounded-xl bg-black max-h-[70vh]"
        />
        <Watermark label={userName} />
      </div>
    );
  }

  // ── IMAGE ────────────────────────────────────────────────────────────────────
  if (isImage) {
    return (
      <SecureFrame
        src={streamUrl}
        title={title}
        userName={userName}
        type="image"
      />
    );
  }

  // ── Unsupported ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-500">
      <AlertCircle className="w-12 h-12 text-amber-400" />
      <p className="font-medium">Type de fichier non prévisualisable ({mimeType})</p>
    </div>
  );
}

// ── Secure iframe wrapper ─────────────────────────────────────────────────────

function SecureFrame({
  src,
  title,
  userName,
  type,
}: {
  src: string;
  title: string;
  userName: string;
  type: "pdf" | "image";
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Safety timeout: if it hasn't loaded in 10 seconds, show error
  useEffect(() => {
    if (status === "loading") {
      const timer = setTimeout(() => {
        setStatus("error");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // For images we use an <img> inside the secure container
  if (type === "image") {
    return (
      <div
        className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={title}
          draggable={false}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
          className="w-full max-h-[80vh] object-contain"
        />
        <Watermark label={userName} />
      </div>
    );
  }

  // PDF iframe
  return (
    <div
      className="relative rounded-xl overflow-hidden select-none"
      style={{ height: "90vh" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800 z-10">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Chargement du document…</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800 z-10">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-slate-500">Impossible de charger la ressource. Vérifiez l'URL ou vos permissions Drive.</p>
        </div>
      )}
      <div className="relative w-full h-full group">
        {/* Anti-right-click & interaction shield for the top toolbar area */}
        <div className="absolute top-0 left-0 right-0 h-14 z-20 bg-transparent" />
        
        <iframe
          ref={iframeRef}
          src={`${src}#toolbar=0&navpanes=0&scrollbar=1`}
          title={title}
          className="w-full h-full border-0"
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
        />
      </div>
      {status === "ready" && <Watermark label={userName} />}
    </div>
  );
}

// ── Watermark ─────────────────────────────────────────────────────────────────

function Watermark({ label }: { label: string }) {
  const text = `${label} — Objectif Prépa — Confidentiel`;

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <span
            key={`${row}-${col}`}
            className="absolute text-slate-400/20 dark:text-white/10 text-xs font-semibold whitespace-nowrap rotate-[-35deg]"
            style={{
              top: `${row * 20 + 5}%`,
              left: `${col * 30 - 5}%`,
            }}
          >
            {text}
          </span>
        ))
      )}
    </div>
  );
}
