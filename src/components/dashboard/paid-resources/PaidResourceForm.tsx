"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPaidResource, updatePaidResource } from "@/actions/paidResources";
import { PaidResourceTypeValues, PaidResourceStatusValues } from "@/types/paid-resources";
import { Loader2, Save, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Subject { id: string; name: string }
interface Class { id: string; name: string }
interface Teacher { id: string; user: { name: string | null } }

interface PaidResourceFormProps {
  subjects: Subject[];
  classes: Class[];
  teachers: Teacher[];
  defaultValues?: {
    id?: string;
    title?: string;
    description?: string;
    price?: number;
    type?: string;
    source?: string;
    mimeType?: string;
    externalUrl?: string;
    subjectId?: string;
    classId?: string;
    teacherId?: string;
    status?: string;
  };
  mode?: "create" | "edit";
}

export function PaidResourceForm({
  subjects,
  classes,
  teachers,
  defaultValues = {},
  mode = "create",
}: PaidResourceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(defaultValues.title ?? "");
  const [description, setDescription] = useState(defaultValues.description ?? "");
  const [price, setPrice] = useState(String(defaultValues.price ?? ""));
  const [type, setType] = useState(defaultValues.type ?? "PDF");
  const [externalUrl, setExternalUrl] = useState(defaultValues.externalUrl ?? "");
  const [subjectId, setSubjectId] = useState(defaultValues.subjectId ?? "");
  const [classId, setClassId] = useState(defaultValues.classId ?? "");
  const [teacherId, setTeacherId] = useState(defaultValues.teacherId ?? "");
  const [status, setStatus] = useState("PUBLISHED");

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = new FormData();
    form.set("title", title);
    form.set("description", description);
    form.set("price", price);
    form.set("type", type);
    form.set("source", "URL");
    form.set("subjectId", subjectId);
    form.set("classId", classId);
    form.set("teacherId", teacherId);
    form.set("status", "PUBLISHED");

    if (!externalUrl) {
      toast.error("Veuillez saisir une URL.");
      return;
    }
    form.set("externalUrl", externalUrl);

    startTransition(async () => {
      const result =
        mode === "edit" && defaultValues.id
          ? await updatePaidResource(defaultValues.id, form)
          : await createPaidResource(form);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        router.push("/dashboard/paid-resources");
      }
    });
  };

  const inputCls = "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";
  const sectionCls = "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic info */}
      <div className={sectionCls}>
        <h3 className="font-semibold text-slate-800 dark:text-white">Informations générales</h3>

        <div>
          <label className={labelCls}>Titre *</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Cours complet de Mathématiques BAC" />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={cn(inputCls, "resize-none min-h-[80px]")} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description de la ressource..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Prix (MAD) *</label>
            <input className={inputCls} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Type de fichier *</label>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              {PaidResourceTypeValues.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Relations */}
      <div className={sectionCls}>
        <h3 className="font-semibold text-slate-800 dark:text-white">Classification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Matière</label>
            <Select value={subjectId} onValueChange={setSubjectId as any}>
              <SelectTrigger className={cn(inputCls, "h-auto")}>
                <SelectValue placeholder="— Toutes matières —">
                  {subjects.find(s => s.id === subjectId)?.name || "— Toutes matières —"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Toutes matières —</SelectItem>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Classe</label>
            <Select value={classId} onValueChange={setClassId as any}>
              <SelectTrigger className={cn(inputCls, "h-auto")}>
                <SelectValue placeholder="— Toutes classes —">
                  {classes.find(c => c.id === classId)?.name || "— Toutes classes —"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Toutes classes —</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Professeur</label>
            <Select value={teacherId} onValueChange={setTeacherId as any}>
              <SelectTrigger className={cn(inputCls, "h-auto")}>
                <SelectValue placeholder="— Non assigné —">
                  {teachers.find(t => t.id === teacherId)?.user.name || "— Non assigné —"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Non assigné —</SelectItem>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.user.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Link Source */}
      <div className={sectionCls}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Source de la ressource</h3>
        </div>

        <div>
          <label className={labelCls}>URL de la ressource *</label>
          <input
            className={inputCls}
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            required
            placeholder="https://vimeo.com/..., https://drive.google.com/..., etc."
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez l'URL directe du fichier ou de la vidéo. L'URL réelle sera <strong>masquée</strong> aux étudiants et servie via notre proxy sécurisé.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {mode === "create" ? "Créer la ressource" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
