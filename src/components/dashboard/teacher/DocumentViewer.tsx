"use client";

import { ReactElement, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Eye, 
  X, 
  Download, 
  Maximize2, 
  ExternalLink, 
  Loader2,
  FileText,
  ImageIcon,
  VideoIcon
} from "lucide-react";

interface DocumentViewerProps {
  id?: string;
  notificationId?: string;
  url?: string;
  name: string;
  type: string;
  trigger?: React.ReactNode;
}

export function DocumentViewer({ id, notificationId, url, name, type, trigger }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  
  let resourceUrl = url || "";
  if (id) resourceUrl = `/api/resource/${id}`;
  else if (notificationId) resourceUrl = `/api/notification-file/${notificationId}`;

  const renderViewer = () => {
    switch (type) {
      case "PDF":
        return (
          <div className="relative w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 transition-opacity">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            <iframe 
              src={resourceUrl} 
              className="w-full h-full border-none shadow-inner"
              onLoad={() => setLoading(false)}
              title={name}
            />
          </div>
        );
      case "IMAGE":
        return (
          <div className="flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden min-h-[40vh] max-h-[70vh] border border-slate-800 shadow-2xl relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            <img 
              src={resourceUrl} 
              alt={name} 
              className="max-w-full max-h-[70vh] object-contain"
              onLoad={() => setLoading(false)}
            />
          </div>
        );
      case "VIDEO":
        return (
          <div className="bg-black rounded-lg overflow-hidden shadow-2xl aspect-video border border-slate-800 relative">
            <video 
              src={resourceUrl} 
              controls 
              className="w-full h-full"
              autoPlay
            />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium font-heading">Ce type de fichier ne peut pas être prévisualisé.</p>
            <Button 
              className="mt-4 bg-blue-600 hover:bg-blue-700 h-10 rounded-full px-6 transition-all active:scale-95" 
              onClick={() => window.open(resourceUrl, "_blank")}
            >
              <Download className="w-4 h-4 mr-2" /> Télécharger ({name})
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && setLoading(true)}>
      <DialogTrigger 
        render={trigger as ReactElement}
        className={!trigger ? cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all") : undefined}
      >
        {!trigger && <Eye className="w-4 h-4" />}
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] sm:w-[90vw] p-0 bg-transparent border-none shadow-none gap-0">
        <div className="bg-white rounded-t-2xl p-4 flex items-center justify-between border-b border-slate-100 shadow-sm relative z-20">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 scale-90 sm:scale-100">
              {type === "PDF" ? <FileText className="w-5 h-5" /> : 
               type === "IMAGE" ? <ImageIcon className="w-5 h-5" /> : 
               <VideoIcon className="w-5 h-5" />}
            </div>
            <DialogTitle className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-md">
              {name}
            </DialogTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(resourceUrl + "?download=1", "_blank")}
              className="hidden sm:flex h-9 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              <Download className="w-4 h-4 mr-2" /> Télécharger
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full bg-slate-100/50 hover:bg-red-50 hover:text-red-500 transition-colors"
              onClick={() => (document.querySelector('[data-slot="dialog-close"]') as HTMLElement)?.click()}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="bg-slate-50 p-4 sm:p-6 rounded-b-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
           {renderViewer()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
