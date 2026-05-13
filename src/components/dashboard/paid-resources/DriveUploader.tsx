"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, FileText, Image, Video, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriveUploaderProps {
  subjectName?: string;
  onUploaded: (result: { driveFileId: string; mimeType: string; name: string }) => void;
  onError?: (error: string) => void;
  accept?: string;
  disabled?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "application/pdf": FileText,
  image: Image,
  video: Video,
};

function getFileIcon(mimeType: string) {
  if (ICON_MAP[mimeType]) return ICON_MAP[mimeType];
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  return FileText;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function DriveUploader({
  subjectName = "General",
  onUploaded,
  onError,
  accept = "application/pdf,image/*,video/*",
  disabled = false,
}: DriveUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setState("uploading");
      setProgress(0);
      setErrorMsg(null);

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("subjectName", subjectName);

        // Use XMLHttpRequest to track upload progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/paid-resources/upload");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              onUploaded({ driveFileId: data.driveFileId, mimeType: data.mimeType, name: data.name });
              setState("success");
              setProgress(100);
              resolve();
            } else {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || "Échec de l'upload"));
            }
          };

          xhr.onerror = () => reject(new Error("Erreur réseau"));
          xhr.send(form);
        });
      } catch (err: any) {
        const msg = err.message || "Erreur lors de l'upload";
        setErrorMsg(msg);
        setState("error");
        onError?.(msg);
      }
    },
    [subjectName, onUploaded, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const reset = () => {
    setState("idle");
    setFileName(null);
    setErrorMsg(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => state === "idle" && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer select-none",
          dragOver && "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
          state === "idle" && !dragOver && "border-slate-200 hover:border-blue-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50",
          state === "uploading" && "border-blue-400 bg-blue-50/50 cursor-wait dark:bg-blue-950/10",
          state === "success" && "border-green-400 bg-green-50/50 dark:bg-green-950/10",
          state === "error" && "border-red-400 bg-red-50/50 dark:bg-red-950/10",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={disabled || state === "uploading"}
        />

        {state === "idle" && (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Upload className="w-7 h-7 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Glissez un fichier ici ou <span className="text-blue-500">cliquez</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">PDF, Image, Vidéo — max 500 MB</p>
            </div>
          </>
        )}

        {state === "uploading" && (
          <>
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="font-medium text-blue-600 dark:text-blue-400">
              Upload en cours — {fileName}
            </p>
            <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-slate-500">{progress}%</span>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="font-medium text-green-600 dark:text-green-400">
              {fileName} — uploadé avec succès!
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-sm text-slate-500 underline hover:text-slate-700"
            >
              Changer de fichier
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="font-medium text-red-600 dark:text-red-400">Échec de l'upload</p>
            <p className="text-sm text-slate-500">{errorMsg}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-sm text-red-500 underline hover:text-red-700"
            >
              Réessayer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
