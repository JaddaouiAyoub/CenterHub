"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ExternalLink, Loader2, Play } from "lucide-react";
import Image from "next/image";
import { PdfViewer } from "@/components/dashboard/paid-resources/PdfViewer";

export function PaidFormationResourceViewer({
  resourceId,
  title,
  mimeType,
  userName,
  driveFileId,
}: {
  resourceId: string;
  title: string;
  mimeType: string;
  userName: string;
  driveFileId: string | null;
}) {
  const streamUrl = `/api/paid-formations/stream/${resourceId}`;
  const isVideo = mimeType.startsWith("video/");
  const isDriveVideo = isVideo && Boolean(driveFileId);
  const [loading, setLoading] = useState(!isDriveVideo);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!loading || mimeType === "application/pdf" || isDriveVideo) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setLoadError(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [loading, mimeType, isDriveVideo]);

  const markLoaded = useCallback(() => {
    setLoading(false);
    setLoadError(false);
  }, []);

  const markFailed = useCallback(() => {
    setLoading(false);
    setLoadError(true);
  }, []);

  return (
    <div
      className="relative min-h-64 select-none overflow-hidden rounded-md bg-slate-950"
      aria-busy={loading}
      onContextMenu={(event) => event.preventDefault()}
    >
      {loadError ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <AlertCircle className="h-8 w-8 text-amber-400" />
          <p className="text-sm">Impossible de charger cette ressource. Vérifiez le lien ou réessayez plus tard.</p>
        </div>
      ) : (
        <>
          {mimeType === "application/pdf" ? (
            <div className="h-[75vh] w-full">
              <PdfViewer url={streamUrl} onLoadSuccess={markLoaded} onLoadError={markFailed} />
            </div>
          ) : isVideo ? (
            isDriveVideo ? (
              <div className="flex aspect-video max-h-[75vh] w-full flex-col items-center justify-center gap-3 bg-black p-4 text-center text-white">
                <Play className="h-10 w-10 text-white/80" />
                <a
                  href={`https://drive.google.com/file/d/${encodeURIComponent(driveFileId!)}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Lire avec Google Drive
                  <ExternalLink className="h-4 w-4" />
                </a>
                <p className="text-xs text-white/65">Le lecteur s’ouvrira dans un nouvel onglet.</p>
              </div>
            ) : (
              <video src={streamUrl} preload="metadata" controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline draggable={false} onLoadedMetadata={markLoaded} onCanPlay={markLoaded} onError={markFailed} className="aspect-video max-h-[75vh] w-full bg-black object-contain" />
            )
          ) : mimeType.startsWith("image/") ? (
            <Image src={streamUrl} alt={title} width={1600} height={1200} unoptimized draggable={false} onLoad={markLoaded} onError={markFailed} className="mx-auto max-h-[75vh] max-w-full object-contain" />
          ) : (
            <div className="flex h-64 items-center justify-center gap-2 text-sm text-white"><Play className="h-4 w-4" />Format non prévisualisable</div>
          )}
          {loading && mimeType !== "application/pdf" && !isDriveVideo && (
            <div
              className={mimeType.startsWith("video/")
                ? "pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded bg-slate-950/75 px-3 py-2 text-white"
                : "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/75 text-white"}
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              <span className="text-sm">Chargement de la ressource…</span>
            </div>
          )}
          {!loading && <Watermark label={userName} />}
        </>
      )}
    </div>
  );
}

function Watermark({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, row) =>
        Array.from({ length: 2 }).map((_, column) => (
          <span
            key={`${row}-${column}`}
            className="absolute whitespace-nowrap text-xs font-medium text-slate-700/20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] dark:text-white/15"
            style={{ top: `${row * 45 + 20}%`, left: `${column * 42 + 8}%`, transform: "rotate(-35deg)" }}
          >
            {label}
          </span>
        )),
      )}
    </div>
  );
}
