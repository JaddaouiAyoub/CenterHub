"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, Eye, Loader2, PenLine, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { gradePaidFormationExam, submitPaidFormationExam } from "@/actions/paidFormations";
import { formatGrade } from "@/lib/paid-formation-format";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface ExamSubmissionItem {
  id: string;
  status: string;
  grade: number | null;
  remarks: string | null;
  /** Date déjà formatée côté serveur (voir formatSubmissionDate). */
  submittedAtLabel: string;
  studentName: string;
  studentEmail?: string;
}

const inputClassName = "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800";
const cancelClassName = "rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800";
const submitClassName = "inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50";

export function ExamSubmissionStatus({ submission }: { submission: Pick<ExamSubmissionItem, "status" | "grade"> }) {
  return submission.status === "GRADED" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" />Corrigée · {formatGrade(submission.grade)}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
      <Clock className="h-3.5 w-3.5" />En attente
    </span>
  );
}

/** Lien affiché dans l'arborescence vers la page des copies d'un dossier d'examen. */
export function ExamSubmissionsLink({ href, total, pending }: { href: string; total: number; pending: number }) {
  return (
    <Link href={href} className="group mt-2 flex items-center justify-between gap-3 rounded-md border border-violet-200 bg-violet-50/60 px-3 py-2.5 text-sm hover:border-violet-300 hover:bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/20 dark:hover:bg-violet-950/40">
      <span className="font-medium text-violet-900 dark:text-violet-200">Copies soumises</span>
      <span className="flex items-center gap-3 text-xs">
        <span className="text-slate-600 dark:text-slate-300">{total} copie{total > 1 ? "s" : ""}</span>
        {pending > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">{pending} en attente</span>}
        <ChevronRight className="h-4 w-4 text-violet-500 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Formulaire de notation, utilisé dans la popup du tableau et à côté du lecteur. */
export function ExamGradeForm({
  submission,
  onDone,
  onCancel,
}: {
  submission: Pick<ExamSubmissionItem, "id" | "grade" | "remarks">;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [grade, setGrade] = useState(submission.grade === null ? "" : String(submission.grade));
  const [remarks, setRemarks] = useState(submission.remarks ?? "");

  const handleGrade = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData();
    data.set("submissionId", submission.id);
    data.set("grade", grade);
    data.set("remarks", remarks);
    startTransition(async () => {
      const result = await gradePaidFormationExam(data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      onDone?.();
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleGrade} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Note sur 20
        <input value={grade} onChange={(event) => setGrade(event.target.value)} type="number" min={0} max={20} step={0.25} required className={inputClassName} />
      </label>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Remarques
        <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} maxLength={2000} rows={4} className={`${inputClassName} resize-y`} placeholder="Remarques facultatives pour l'étudiant" />
      </label>
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        {onCancel && <button type="button" disabled={pending} onClick={onCancel} className={cancelClassName}>Annuler</button>}
        <button disabled={pending} className={submitClassName}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{pending ? "Enregistrement…" : "Enregistrer la note"}
        </button>
      </div>
    </form>
  );
}

type SubmissionFilter = "ALL" | "PENDING" | "GRADED";

const FILTERS: { value: SubmissionFilter; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "GRADED", label: "Corrigées" },
];

/** Tableau des copies d'un dossier d'examen : filtres, recherche, lecture et notation. */
export function ExamSubmissionsBoard({
  formationId,
  submissions,
  canGrade,
  locale,
}: {
  formationId: string;
  submissions: ExamSubmissionItem[];
  canGrade: boolean;
  locale: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<SubmissionFilter>("ALL");
  const [query, setQuery] = useState("");
  const [gradingSubmission, setGradingSubmission] = useState<ExamSubmissionItem | null>(null);

  const counts: Record<SubmissionFilter, number> = {
    ALL: submissions.length,
    PENDING: submissions.filter((submission) => submission.status === "PENDING").length,
    GRADED: submissions.filter((submission) => submission.status === "GRADED").length,
  };

  const visibleSubmissions = useMemo(() => {
    const search = query.trim().toLowerCase();
    return submissions.filter((submission) =>
      (filter === "ALL" || submission.status === filter)
      && (!search
        || submission.studentName.toLowerCase().includes(search)
        || Boolean(submission.studentEmail?.toLowerCase().includes(search))));
  }, [submissions, filter, query]);

  const submissionHref = (id: string) => `/${locale}/dashboard/paid-formations/${formationId}/submissions/${id}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-slate-200 p-0.5 dark:border-slate-700" role="tablist">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${filter === item.value
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              {item.label} <span className="opacity-70">({counts[item.value]})</span>
            </button>
          ))}
        </div>
        <label className="relative w-full sm:w-72">
          <span className="sr-only">Rechercher un étudiant</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un étudiant…" className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-800" />
        </label>
      </div>

      {visibleSubmissions.length ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Étudiant</th>
                <th className="px-4 py-3 font-semibold">Soumise le</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleSubmissions.map((submission) => (
                <tr
                  key={submission.id}
                  onClick={() => router.push(submissionHref(submission.id))}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{submission.studentName}</p>
                    {submission.studentEmail && submission.studentEmail !== submission.studentName && (
                      <p className="text-xs text-slate-500">{submission.studentEmail}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{submission.submittedAtLabel}</td>
                  <td className="px-4 py-3">
                    <ExamSubmissionStatus submission={submission} />
                    {submission.remarks && <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{submission.remarks}</p>}
                  </td>
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={submissionHref(submission.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                        <Eye className="h-3.5 w-3.5" />Lire
                      </Link>
                      {canGrade && (
                        <button type="button" onClick={() => setGradingSubmission(submission)} className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800">
                          <PenLine className="h-3.5 w-3.5" />{submission.status === "GRADED" ? "Modifier" : "Noter"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          {submissions.length ? "Aucune copie ne correspond à ces critères." : "Aucune copie soumise pour le moment."}
        </p>
      )}

      <Dialog open={Boolean(gradingSubmission)} onOpenChange={(open) => { if (!open) setGradingSubmission(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Noter la copie</DialogTitle>
            <DialogDescription>{gradingSubmission?.studentName}</DialogDescription>
          </DialogHeader>
          {gradingSubmission && (
            <ExamGradeForm
              key={gradingSubmission.id}
              submission={gradingSubmission}
              onDone={() => setGradingSubmission(null)}
              onCancel={() => setGradingSubmission(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PaidFormationExamStudentPanel({
  folderId,
  formationId,
  submission,
  canSubmit,
  locale,
}: {
  folderId: string;
  formationId: string;
  submission: ExamSubmissionItem | null;
  canSubmit: boolean;
  locale: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData();
    data.set("folderId", folderId);
    data.set("submissionUrl", submissionUrl);
    startTransition(async () => {
      const result = await submitPaidFormationExam(data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setSubmissionUrl("");
      setOpen(false);
      router.refresh();
    });
  };

  const graded = submission?.status === "GRADED";

  return (
    <div className="mt-2 flex flex-wrap items-start justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="min-w-0 space-y-1 text-sm">
        {submission ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <ExamSubmissionStatus submission={submission} />
              <Link href={`/${locale}/dashboard/paid-formations/${formationId}/submissions/${submission.id}`} className="text-xs font-semibold text-blue-700 hover:underline">Voir ma copie</Link>
            </div>
            <p className="text-xs text-slate-500">Soumise le {submission.submittedAtLabel}</p>
            {graded && submission.remarks && (
              <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200"><span className="font-semibold">Remarques : </span>{submission.remarks}</p>
            )}
          </>
        ) : (
          <p className="text-slate-600 dark:text-slate-300">Vous n’avez pas encore soumis votre examen.</p>
        )}
      </div>
      {!graded && canSubmit && (
        <Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next); }}>
          <DialogTrigger className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800">
            <Send className="h-4 w-4" />{submission ? "Remplacer ma copie" : "Soumettre l’examen"}
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Soumettre l’examen</DialogTitle>
              <DialogDescription>Collez le lien Google Drive de votre copie (PDF ou image). Le fichier doit être partagé en accès public.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Lien Google Drive
                <input value={submissionUrl} onChange={(event) => setSubmissionUrl(event.target.value)} type="url" required autoFocus placeholder="https://drive.google.com/file/d/…" className={inputClassName} />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                <button type="button" disabled={pending} onClick={() => setOpen(false)} className={cancelClassName}>Annuler</button>
                <button disabled={pending || !submissionUrl} className={submitClassName}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pending ? "Envoi…" : "Soumettre"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
