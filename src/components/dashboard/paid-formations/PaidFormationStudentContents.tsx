import Link from "next/link";
import { FileText, Folder, Lock, Play } from "lucide-react";

interface FormationFolderNode {
  id: string;
  name: string;
  parentId: string | null;
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
  const renderFolder = (parentId: string | null, depth = 0): React.ReactNode =>
    folders.filter((folder) => folder.parentId === parentId).map((folder) => (
      <section key={folder.id} className="border-l border-slate-200 py-2 dark:border-slate-700" style={{ marginLeft: depth * 16 }}>
        <h2 className="flex items-center gap-2 px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">
          <Folder className="h-4 w-4 text-amber-600" />{folder.name}
        </h2>
        <div className="divide-y divide-slate-100 pl-4 dark:divide-slate-800">
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
        </div>
        {renderFolder(folder.id, depth + 1)}
      </section>
    ));

  if (!folders.some((folder) => folder.parentId === null)) {
    return <p className="py-10 text-center text-sm text-slate-500">Le contenu de cette formation sera bientôt disponible.</p>;
  }

  return <div className="divide-y divide-slate-200 dark:divide-slate-700">{renderFolder(null)}</div>;
}
