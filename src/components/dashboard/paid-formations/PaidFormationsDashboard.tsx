"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, FolderTree, Plus, Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { createPaidFormation } from "@/actions/paidFormations";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FormationSummary {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: string;
  totalSales: number;
  totalRevenue: number;
  _count: { folders: number; purchases: number };
  isPurchased?: boolean;
}

export function PaidFormationsDashboard({
  formations,
  canManage,
}: {
  formations: FormationSummary[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("status", "PUBLISHED");
    startTransition(async () => {
      const result = await createPaidFormation(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setName("");
      setDescription("");
      setPrice("");
      setCreateOpen(false);
      router.push(`/${locale}/dashboard/paid-formations/${result.formationId}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end border-b border-slate-200 pb-5 dark:border-slate-700">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">
              <Plus className="h-4 w-4" />Nouvelle formation
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Créer une formation</DialogTitle>
                <DialogDescription>Définissez son nom, sa description et son prix. Vous pourrez ensuite organiser les ressources par dossiers.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nom de la formation
                  <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" placeholder="Ex. Préparation au baccalauréat" />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Description
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" placeholder="Description facultative" />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Prix (MAD)
                  <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" placeholder="0.00" />
                </label>
                <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <button type="button" disabled={pending} onClick={() => setCreateOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Annuler</button>
                  <button type="submit" disabled={pending} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {pending ? "Création…" : "Créer"}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {formations.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">Aucune formation payante disponible.</div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {formations.map((formation) => (
            <Link key={formation.id} href={`/${locale}/dashboard/paid-formations/${formation.id}`} className="group flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 shrink-0 text-blue-700" />
                  <h2 className="truncate font-semibold text-slate-900 dark:text-white">{formation.name}</h2>
                  <span className={`shrink-0 rounded-sm px-2 py-0.5 text-xs ${formation.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {formation.status === "PUBLISHED" ? "Publiée" : formation.status === "DRAFT" ? "Brouillon" : "Archivée"}
                  </span>
                </div>
                {formation.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{formation.description}</p>}
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><FolderTree className="h-3.5 w-3.5" />{formation._count.folders} dossiers</span>
                  {canManage && <span>{formation.totalSales} ventes · {formation.totalRevenue.toLocaleString("fr-MA")} MAD</span>}
                  {!canManage && <span>{formation.isPurchased ? "Achetée" : "Accès après paiement manuel"}</span>}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="font-semibold text-slate-900 dark:text-white">{formation.price.toLocaleString("fr-MA")} MAD</span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
