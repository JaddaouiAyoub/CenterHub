"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configuration du worker - Utilisation d'un CDN pour correspondre à la version installée
// On utilise la version minifiée du worker pour de meilleures performances
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: any) => void;
}

export function PdfViewer({ url, onLoadSuccess, onLoadError }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container) return;

    // Reset state
    container.innerHTML = "";
    setLoading(true);
    setError(null);
    setProgress(0);

    const loadPdf = async () => {
      try {
        // Chargement du document
        const loadingTask = pdfjsLib.getDocument({
          url,
          withCredentials: true, // Important pour passer les cookies de session auth
        });
        
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;

        // Rendu séquentiel des pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (!isMounted) break;
          
          setProgress(Math.round((pageNum / pdf.numPages) * 100));
          
          const page = await pdf.getPage(pageNum);
          
          // On calcule l'échelle pour s'adapter à la largeur du conteneur
          // On utilise un multiplicateur de 2 pour un rendu net (Retina/Mobile)
          const unscaledViewport = page.getViewport({ scale: 1 });
          const containerWidth = container.clientWidth || 800;
          const scale = (containerWidth / unscaledViewport.width) * 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.className = "w-full h-auto mb-6 rounded-lg shadow-md bg-white border border-slate-200 dark:border-slate-700";
          const context = canvas.getContext("2d");
          
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          
          if (isMounted) {
            container.appendChild(canvas);
          }
        }

        if (isMounted) {
          setLoading(false);
          onLoadSuccess?.();
        }
      } catch (err: any) {
        console.error("PDF.js rendering error:", err);
        if (isMounted) {
          setError(err.message || "Erreur lors du rendu du document.");
          setLoading(false);
          onLoadError?.(err);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [url, onLoadSuccess, onLoadError]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 dark:bg-slate-900/50 overflow-auto scroll-smooth">
      {loading && (
        <div className="sticky top-0 left-0 right-0 h-full flex flex-col items-center justify-center gap-4 bg-slate-50/90 dark:bg-slate-900/90 z-20 backdrop-blur-sm">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600">
              {progress}%
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Optimisation pour mobile...</p>
            <p className="text-xs text-slate-500">Préparation de l'affichage sécurisé</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center p-12 text-center gap-4 h-full">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div className="space-y-2">
            <p className="font-bold text-slate-800 dark:text-slate-100">Oups ! Impossible d'afficher le PDF</p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">{error}</p>
          </div>
        </div>
      )}

      <div 
        ref={containerRef} 
        className="flex flex-col items-center p-2 sm:p-6 max-w-5xl mx-auto w-full"
      />
    </div>
  );
}
