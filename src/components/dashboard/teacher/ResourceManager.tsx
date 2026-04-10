"use client";

import { useState, useEffect, useRef } from "react";
import { uploadResources, getCourseResources, deleteResource } from "@/actions/resources";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileIcon, 
  ImageIcon, 
  VideoIcon, 
  Trash2, 
  Upload, 
  X, 
  FileText, 
  Eye, 
  Plus,
  Loader2,
  FileUp
} from "lucide-react";
import { toast } from "sonner";
import { DocumentViewer } from "./DocumentViewer";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";


interface Resource {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: Date;
}

export function ResourceManager({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [existingResources, setExistingResources] = useState<Resource[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResources();
  }, [courseId]);

  const loadResources = async () => {
    setLoading(true);
    const res = await getCourseResources(courseId);
    if (res.resources) setExistingResources(res.resources as any);
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: file.type.startsWith("image/") || file.type === "application/pdf" 
          ? URL.createObjectURL(file) 
          : ""
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    const file = selectedFiles[index];
    if (file.preview) URL.revokeObjectURL(file.preview);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(f => formData.append("files", f.file));

    try {
      const res = await uploadResources(courseId, formData);
      if (res.success) {
        if (res.errors && res.errors.length > 0) {
          toast.warning(`${res.success}, mais avec des erreurs : ${res.errors.join(", ")}`);
        } else {
          toast.success(res.success);
        }
        setSelectedFiles([]);
        loadResources();
      } else {
        toast.error(res.error || "Erreur d'upload");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    toast.promise(deleteResource(id), {
      loading: "Suppression...",
      success: () => {
        setExistingResources(prev => prev.filter(r => r.id !== id));
        return "Fichier supprimé";
      },
      error: "Échec de la suppression"
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "IMAGE": return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case "VIDEO": return <VideoIcon className="w-5 h-5 text-purple-500" />;
      case "PDF": return <FileText className="w-5 h-5 text-red-500" />;
      default: return <FileIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Upload Section */}
      <div className="space-y-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple 
            className="hidden" 
          />
          <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <FileUp className="text-blue-600 w-6 h-6" />
          </div>
          <p className="font-bold text-slate-700">Cliquez pour ajouter des documents</p>
          <p className="text-xs text-slate-400 mt-1">PDF, Images, Vidéos acceptés</p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-700">Fichiers à envoyer ({selectedFiles.length})</h4>
              <Button 
                onClick={handleUpload} 
                disabled={uploading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-9"
              >
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Tout envoyer
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedFiles.map((sf, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm aspect-video">
                  {sf.file.type.startsWith("image/") ? (
                    <img src={sf.preview} className="w-full h-full object-cover" alt="preview" />
                  ) : sf.file.type === "application/pdf" ? (
                    <iframe src={sf.preview} className="w-full h-full" title="pdf-preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                      <FileIcon className="w-8 h-8 text-slate-300" />
                      <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full px-2">{sf.file.name}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => removeSelectedFile(i)}
                    className="absolute top-1 right-1 bg-white/80 hover:bg-red-500 hover:text-white p-1 rounded-full text-slate-600 transition-colors shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* Existing Resources List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          Documents associés à la séance
        </h3>
        
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-200" /></div>
        ) : existingResources.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Plus className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium font-heading">Aucun document partagé pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingResources.map((res) => (
              <div 
                key={res.id} 
                className="group relative flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="p-3 bg-slate-50 group-hover:bg-blue-50 rounded-xl shrink-0 transition-colors">
                    {getIcon(res.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{res.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{new Date(res.createdAt).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })} • {res.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 pl-2">
                  <DocumentViewer 
                    id={res.id} 
                    name={res.name} 
                    type={res.type} 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(res.id)}
                    className="h-9 w-9 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
