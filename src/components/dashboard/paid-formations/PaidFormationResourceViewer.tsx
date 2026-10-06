"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Play } from "lucide-react";
import Image from "next/image";

export function PaidFormationResourceViewer({
  resourceId,
  title,
  mimeType,
  userName,
}: {
  resourceId: string;
  title: string;
  mimeType: string;
  userName: string;
}) {
  const streamUrl = `/api/paid-formations/stream/${resourceId}`;
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setLoadError(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [loading]);

  const markLoaded = () => {
    setLoading(false);
    setLoadError(false);
  };

  const markFailed = () => {
    setLoading(false);
    setLoadError(true);
  };

  return (
    <div className="relative min-h-64 overflow-hidden rounded-md bg-slate-950" aria-busy={loading}>
      {loadError ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <AlertCircle className="h-8 w-8 text-amber-400" />
          <p className="text-sm">Impossible de charger cette ressource. Vérifiez le lien ou réessayez plus tard.</p>
        </div>
      ) : (
        <>
          {mimeType === "application/pdf" ? (
            <iframe title={title} src={`${streamUrl}#toolbar=0&navpanes=0`} onLoad={markLoaded} onError={markFailed} className="h-[75vh] w-full bg-white" />
          ) : mimeType.startsWith("video/") ? (
            <video src={streamUrl} controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline onLoadedData={markLoaded} onError={markFailed} className="max-h-[75vh] w-full" />
          ) : mimeType.startsWith("image/") ? (
            <Image src={streamUrl} alt={title} width={1600} height={1200} unoptimized draggable={false} onLoad={markLoaded} onError={markFailed} className="mx-auto max-h-[75vh] max-w-full object-contain" />
          ) : (
            <div className="flex h-64 items-center justify-center gap-2 text-sm text-white"><Play className="h-4 w-4" />Format non prévisualisable</div>
          )}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/75 text-white" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
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
