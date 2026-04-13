"use client";

import { useState, useEffect } from "react";
import { getClasses } from "@/actions/courses";
import { getTeachersForNotification } from "@/actions/notifications";
import { sendNotification } from "@/actions/notifications";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, X, FileText, Video, ImageIcon, FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  senderId: string;
  senderRole: "SECRETARY" | "TEACHER";
  /** For teacher: only their assigned classes */
  availableClassIds?: string[];
  onSuccess?: () => void;
}

export function SendNotificationForm({ senderId, senderRole, availableClassIds, onSuccess }: Props) {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<string>(senderRole === "SECRETARY" ? "ALL_CLASSES" : "CLASS");
  const [targetClassId, setTargetClassId] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");

  // Attachment (File to upload directly to Mega via Server Action)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [showAttachment, setShowAttachment] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [cl, te] = await Promise.all([
        getClasses(),
        senderRole === "SECRETARY" ? getTeachersForNotification() : Promise.resolve([]),
      ]);
      // If teacher: filter to only their classes
      if (availableClassIds && availableClassIds.length > 0) {
        setClasses((cl as any[]).filter((c: any) => availableClassIds.includes(c.id)));
      } else {
        setClasses(cl as any[]);
      }
      setTeachers(te as any[]);
    };
    load();
  }, [senderRole, availableClassIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Titre et message requis");
      return;
    }
    if (targetType === "CLASS" && !targetClassId) {
      toast.error("Veuillez sélectionner une classe");
      return;
    }
    if (targetType === "TEACHER" && !targetUserId) {
      toast.error("Veuillez sélectionner un enseignant");
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("message", message);
    formData.set("senderId", senderId);
    formData.set("senderRole", senderRole);
    formData.set("targetType", targetType);
    if (targetClassId) formData.set("targetClassId", targetClassId);
    if (targetUserId) formData.set("targetUserId", targetUserId);
    if (attachmentFile) {
      formData.set("file", attachmentFile);
    }

    setLoading(true);
    toast.promise(sendNotification(formData), {
      loading: "Envoi en cours...",
      success: (res) => {
        if (res.error) throw new Error(res.error);
        setTitle("");
        setMessage("");
        setTargetClassId("");
        setTargetUserId("");
        setAttachmentFile(null);
        setShowAttachment(false);
        onSuccess?.();
        return "Notification envoyée avec succès";
      },
      error: (err) => err.message || "Erreur lors de l'envoi",
      finally: () => setLoading(false),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-bold text-sm">Titre <span className="text-red-500">*</span></Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Devoir de mathématiques pour la semaine"
          className="border-slate-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-11"
          maxLength={120}
        />
        <p className="text-[10px] text-slate-400 text-right">{title.length}/120</p>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-bold text-sm">Description <span className="text-red-500">*</span></Label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Détails de la notification..."
          rows={4}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          maxLength={1000}
        />
        <p className="text-[10px] text-slate-400 text-right">{message.length}/1000</p>
      </div>

      {/* Targeting */}
      <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <Label className="text-slate-700 font-bold text-sm">Destinataire</Label>

        <div className="grid grid-cols-2 gap-2">
          {senderRole === "SECRETARY" && (
            <>
              {[
                { value: "ALL_CLASSES", label: "Toutes les classes" },
                { value: "CLASS",       label: "Classe spécifique" },
                { value: "TEACHER",     label: "Un enseignant" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTargetType(opt.value); setTargetClassId(""); setTargetUserId(""); }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold text-left transition-all border ${
                    targetType === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </>
          )}
          {senderRole === "TEACHER" && (
            <button
              type="button"
              className="py-2 px-3 rounded-lg text-xs font-bold text-left bg-blue-600 text-white border border-blue-600"
            >
              Classe
            </button>
          )}
        </div>

        {/* Class selector */}
        {targetType === "CLASS" && (
          <Select value={targetClassId} onValueChange={(v) => setTargetClassId(v || "")}>
            <SelectTrigger className="border-slate-200 rounded-xl h-11">
              <SelectValue placeholder="Sélectionner la classe">
                {targetClassId ? classes.find(c => c.id === targetClassId)?.name : "Sélectionner la classe"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Teacher selector */}
        {targetType === "TEACHER" && senderRole === "SECRETARY" && (
          <Select value={targetUserId} onValueChange={(v) => setTargetUserId(v || "")}>
            <SelectTrigger className="border-slate-200 rounded-xl h-11">
              <SelectValue placeholder="Sélectionner l'enseignant">
                {targetUserId ? teachers.find(t => t.id === targetUserId)?.name : "Sélectionner l'enseignant"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Attachment Upload */}
      {!showAttachment ? (
        <button
          type="button"
          onClick={() => setShowAttachment(true)}
          className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 py-2 px-3 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 w-full justify-center transition-all"
        >
          <Paperclip className="w-4 h-4" />
          <span>Ajouter une pièce jointe (Sera téléversé sur Mega.nz)</span>
        </button>
      ) : (
        <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between">
            <Label className="text-slate-700 font-bold text-sm flex items-center">
              <Paperclip className="w-3.5 h-3.5 mr-1.5" /> Pièce jointe
            </Label>
            <button type="button" onClick={() => { setShowAttachment(false); setAttachmentFile(null); }}>
              <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Input 
              type="file" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setAttachmentFile(e.target.files[0]);
                }
              }} 
              className="border-slate-200 rounded-xl text-sm bg-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
          </div>

          {attachmentFile && (
            <div className="flex items-center mt-2">
              <Badge className="bg-emerald-100 text-emerald-700 border-none text-xs font-bold">
                ✓ Fichier sélectionné ({Math.round(attachmentFile.size / 1024)} KB)
              </Badge>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-200 transition-all"
      >
        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        Envoyer la notification
      </Button>
    </form>
  );
}
