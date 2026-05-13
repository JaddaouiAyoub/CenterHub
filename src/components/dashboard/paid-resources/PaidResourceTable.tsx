"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, MoreVertical,
  Eye, Pencil, Trash2, FileText, Image, Video, Globe,
  Upload, CheckCircle, Archive, Clock, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deletePaidResource, publishPaidResource, unpublishPaidResource } from "@/actions/paidResources";
import { toast } from "sonner";
import type { PaidResourceDTO } from "@/types/paid-resources";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PaidResourceTableProps {
  resources: PaidResourceDTO[];
  total: number;
  totalPages: number;
  page: number;
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PDF: FileText,
  IMAGE: Image,
  VIDEO: Video,
};

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DRAFT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ARCHIVED: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Publié",
  DRAFT: "Brouillon",
  ARCHIVED: "Archivé",
};

function DropdownMenu({ resource, onAction }: { resource: PaidResourceDTO; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const params = useParams();
  const locale = params.locale as string;

  const handleDelete = () => {
    if (!confirm(`Supprimer "${resource.title}" ? Cette action est irréversible.`)) return;
    startTransition(async () => {
      const r = await deletePaidResource(resource.id);
      if ("error" in r) toast.error(r.error);
      else { toast.success(r.success); onAction(); }
      setOpen(false);
    });
  };

  const handleTogglePublish = () => {
    startTransition(async () => {
      const r = resource.status === "PUBLISHED"
        ? await unpublishPaidResource(resource.id)
        : await publishPaidResource(resource.id);
      if ("error" in r) toast.error(r.error);
      else { toast.success(r.success); onAction(); }
      setOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1 text-sm">
            <Link
              href={`/${locale}/dashboard/paid-resources/${resource.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
              onClick={() => setOpen(false)}
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </Link>
            <button
              onClick={handleTogglePublish}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
            >
              {resource.status === "PUBLISHED" ? (
                <><Archive className="w-3.5 h-3.5" /> Dépublier</>
              ) : (
                <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Publier</>
              )}
            </button>
            <hr className="my-1 border-slate-100 dark:border-slate-700" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function PaidResourceTable({
  resources,
  total,
  totalPages,
  page,
  subjects,
  classes,
}: PaidResourceTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            defaultValue={searchParams.get("search") ?? ""}
            onChange={(e) => updateParam("search", e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          defaultValue={searchParams.get("subjectId") ?? ""}
          onChange={(e) => updateParam("subjectId", e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes matières</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous statuts</option>
          <option value="PUBLISHED">Publié</option>
          <option value="DRAFT">Brouillon</option>
          <option value="ARCHIVED">Archivé</option>
        </select>

        <select
          defaultValue={searchParams.get("type") ?? ""}
          onChange={(e) => updateParam("type", e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous types</option>
          <option value="PDF">PDF</option>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Vidéo</option>
        </select>
      </div>

      {/* Stats row */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {total} ressource{total !== 1 ? "s" : ""} trouvée{total !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Ressource</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Matière</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Prix</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Ventes</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">Revenus</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucune ressource trouvée
                  </td>
                </tr>
              ) : (
                resources.map((resource) => {
                  const TypeIcon = TYPE_ICONS[resource.type] ?? FileText;
                  return (
                    <tr
                      key={resource.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <TypeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                              {resource.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                              {resource.source === "URL" ? (
                                <Globe className="w-3 h-3" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              {resource.source === "URL" ? "URL" : "Drive"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {resource.subject?.name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[resource.status])}>
                          {STATUS_LABELS[resource.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                        {resource.price.toLocaleString("fr-MA")} MAD
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                        {resource.totalSales}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="flex items-center justify-end gap-1 font-semibold text-green-600 dark:text-green-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {resource.totalRevenue.toLocaleString("fr-MA")} MAD
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <DropdownMenu resource={resource} onAction={() => router.refresh()} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <span className="text-sm text-slate-500">
              Page {page} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
