"use client";

import Link from "next/link";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, FileText, Folder, FolderOpen, GraduationCap, Lock, Play } from "lucide-react";
import { type ExamSubmissionItem, ExamSubmissionStatus, PaidFormationExamStudentPanel } from "./PaidFormationExam";
import { useExpandedFolders } from "./useExpandedFolders";

interface FormationFolderNode {
  id: string;
  name: string;
  parentId: string | null;
  isExam: boolean;
  examSubmissions: ExamSubmissionItem[];
  resources: { id: string; title: string; description: string | null; type: string; status: string }[];
}

export function PaidFormationStudentContents({
  formationId,
  folders,
  hasAccess,
  locale,
}: {
  formationId: string;
  folders: FormationFolderNode[];
  hasAccess: boolean;
  locale: string;
}) {
  const { isExpanded, toggle, expandAll, collapseAll } = useExpandedFolders(formationId, folders.map((folder) => folder.id));

  const folderSummary = (folder: FormationFolderNode) => {
    const childCount = folders.filter((child) => child.parentId === folder.id).length;
    const parts = [];
    if (childCount) parts.push(`${childCount} dossier${childCount > 1 ? "s" : ""}`);
    if (folder.resources.length) parts.push(`${folder.resources.length} ressource${folder.resources.length > 1 ? "s" : ""}`);
    return parts.join(" · ") || "Vide";
  };

  const renderFolder = (parentId: string | null, depth = 0): React.ReactNode =>
    folders.filter((folder) => folder.parentId === parentId).map((folder) => {
      const expanded = isExpanded(folder.id);
      const submission = folder.examSubmissions[0];
      return (
        <section key={folder.id} className="border-l border-slate-200 py-1 dark:border-slate-700" style={{ marginLeft: depth * 16 }}>
          <h2>
            <button
              type="button"
              onClick={() => toggle(folder.id)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left font-semibold text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/60"
            >
              <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
              {folder.isExam
                ? <GraduationCap className="h-4 w-4 shrink-0 text-violet-600" />
                : expanded ? <FolderOpen className="h-4 w-4 shrink-0 text-amber-600" /> : <Folder className="h-4 w-4 shrink-0 text-amber-600" />}
              <span className="min-w-0 truncate">{folder.name}</span>
              <span className="shrink-0 text-xs font-normal text-slate-400">{folderSummary(folder)}</span>
              {hasAccess && submission && <span className="ml-auto shrink-0 font-normal"><ExamSubmissionStatus submission={submission} /></span>}
            </button>
          </h2>
          {expanded && (
            <>
              <div className="divide-y divide-slate-100 pl-8 dark:divide-slate-800">
                {folder.resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {resource.type === "VIDEO" ? <Play className="h-4 w-4 shrink-0 text-blue-700" /> : <FileText className="h-4 w-4 shrink-0 text-blue-700" />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{resource.title}</p>
                        {hasAccess && resource.description && <p className="truncate text-xs text-slate-500">{resource.description}</p>}
                      </div>
                    </div>
                    {hasAccess ? (
                      <Link href={`/${locale}/dashboard/paid-formations/${formationId}/resources/${resource.id}`} className="shrink-0 text-sm font-semibold text-blue-700 hover:underline">Lire</Link>
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-slate-400" aria-label="Accès verrouillé" />
                    )}
                  </div>
                ))}
                {hasAccess && folder.isExam && (folder.resources.length > 0 || submission) && (
                  <PaidFormationExamStudentPanel
                    folderId={folder.id}
                    formationId={formationId}
                    submission={submission ?? null}
                    canSubmit={folder.resources.length > 0}
                    locale={locale}
                  />
                )}
              </div>
              {renderFolder(folder.id, depth + 1)}
            </>
          )}
        </section>
      );
    });

  if (!folders.some((folder) => folder.parentId === null)) {
    return <p className="py-10 text-center text-sm text-slate-500">Le contenu de cette formation sera bientôt disponible.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <button type="button" onClick={expandAll} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ChevronsUpDown className="h-4 w-4" />Tout déplier</button>
        <button type="button" onClick={collapseAll} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ChevronsDownUp className="h-4 w-4" />Tout replier</button>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">{renderFolder(null)}</div>
    </div>
  );
}
