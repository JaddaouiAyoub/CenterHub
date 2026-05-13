"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { deletePurchase } from "@/actions/paidResources";
import { toast } from "sonner";
import type { PurchaseDTO } from "@/types/paid-resources";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PurchaseForm } from "./PurchaseForm";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PurchaseTableProps {
  purchases: PurchaseDTO[];
  total: number;
  totalPages: number;
  page: number;
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  COMPLETED: CheckCircle,
  PENDING: Clock,
  REFUNDED: XCircle,
};
const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
  PENDING: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
  REFUNDED: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
};
const STATUS_LABELS: Record<string, string> = { COMPLETED: "Complété", PENDING: "En attente", REFUNDED: "Remboursé" };
const METHOD_LABELS: Record<string, string> = { CASH: "Espèces", CARD: "Carte", TRANSFER: "Virement" };

export function PurchaseTable({ purchases, total, totalPages, page }: PurchaseTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Supprimer l'achat de "${name}" ?`)) return;
    startTransition(async () => {
      const r = await deletePurchase(id);
      if ("error" in r) toast.error(r.error);
      else { toast.success(r.success); router.refresh(); }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            defaultValue={searchParams.get("search") ?? ""}
            onChange={(e) => updateParam("search", e.target.value)}
            placeholder="Rechercher par étudiant ou ressource..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous statuts</option>
          <option value="COMPLETED">Complété</option>
          <option value="PENDING">En attente</option>
          <option value="REFUNDED">Remboursé</option>
        </select>
        <select
          defaultValue={searchParams.get("method") ?? ""}
          onChange={(e) => updateParam("method", e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes méthodes</option>
          <option value="CASH">Espèces</option>
          <option value="CARD">Carte</option>
          <option value="TRANSFER">Virement</option>
        </select>

        <div className="flex-1 text-right">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <Plus className="w-4 h-4 mr-2" />
                Enregistrer un achat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-none bg-white dark:bg-slate-900 shadow-2xl">
              <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  Nouvel Achat (Admin)
                </DialogTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enregistrez manuellement l'achat d'une ressource par un étudiant.
                </p>
              </DialogHeader>
              <PurchaseForm onSuccess={() => { setIsAddOpen(false); router.refresh(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">{total} achat{total !== 1 ? "s" : ""}</p>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Étudiant</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Ressource</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Montant</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Méthode</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Statut</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Aucun achat trouvé</td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const StatusIcon = STATUS_ICONS[p.status] ?? CheckCircle;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{p.student.user.name}</p>
                        <p className="text-xs text-slate-400">{p.student.user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">{p.resource.title}</p>
                        <p className="text-xs text-slate-400">{p.resource.subject?.name ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {format(new Date(p.purchasedAt), "dd MMM yyyy", { locale: fr })}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">
                        {p.amountPaid.toLocaleString("fr-MA")} MAD
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[p.status])}>
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleDelete(p.id, p.resource.title)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <span className="text-sm text-slate-500">Page {page} sur {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
