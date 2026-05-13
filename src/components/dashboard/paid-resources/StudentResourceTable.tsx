"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  ExternalLink,
  Search,
  Calendar,
  Tag
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudentResourceTableProps {
  resources: any[];
  total: number;
  totalPages: number;
  page: number;
}

export function StudentResourceTable({
  resources,
  total,
  totalPages,
  page,
}: StudentResourceTableProps) {
  const { locale } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) params.set("search", search);
    else params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF": return <FileText className="w-4 h-4 text-red-500" />;
      case "IMAGE": return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case "VIDEO": return <Video className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher une ressource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>
        <Button type="submit" variant="secondary">Filtrer</Button>
      </form>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableHead className="w-[40%]">Ressource</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date d'achat</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      {getTypeIcon(r.type)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {r.title}
                      </span>
                      {r.description && (
                        <span className="text-xs text-slate-400 truncate max-w-[200px]">
                          {r.description}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                    <Tag className="w-3.5 h-3.5" />
                    {r.subject?.name || "Général"}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase",
                    r.type === "PDF" && "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
                    r.type === "IMAGE" && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                    r.type === "VIDEO" && "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
                  )}>
                    {r.type}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {r.isPurchased && r.purchasedAt ? (
                      new Date(r.purchasedAt).toLocaleDateString("fr-MA")
                    ) : (
                      "---"
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {r.isPurchased ? (
                    <Link href={`/${locale}/dashboard/paid-resources/${r.id}/view`}>
                      <Button variant="outline" size="sm" className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
                        Voir <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 italic">
                      Non Acheté
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
            <p className="text-xs text-slate-500">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
