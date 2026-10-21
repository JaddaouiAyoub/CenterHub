import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { canReadExamSubmission, getPaidFormationExamSubmission } from "@/lib/paid-formations";
import { PaidFormationResourceViewer } from "@/components/dashboard/paid-formations/PaidFormationResourceViewer";
import { ExamGradeForm, ExamSubmissionStatus } from "@/components/dashboard/paid-formations/PaidFormationExam";
import { formatSubmissionDate } from "@/lib/paid-formation-format";

interface Props {
  params: Promise<{ locale: string; id: string; submissionId: string }>;
}

export default async function PaidFormationExamSubmissionPage({ params }: Props) {
  const { locale, id, submissionId } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const submission = await getPaidFormationExamSubmission(submissionId);
  if (!submission || submission.folder.formationId !== id) notFound();
  if (!await canReadExamSubmission(session.user, submission)) notFound();

  const manager = ["ADMIN", "TEACHER", "SECRETARY"].includes(session.user.role);
  const canGrade = ["ADMIN", "TEACHER"].includes(session.user.role);
  const studentName = submission.student.user.name?.trim() || "Étudiant";
  const backHref = manager
    ? `/${locale}/dashboard/paid-formations/${id}/exams/${submission.folderId}`
    : `/${locale}/dashboard/paid-formations/${id}`;
  const nextPending = canGrade
    ? await prisma.paidFormationExamSubmission.findFirst({
      where: { folderId: submission.folderId, status: "PENDING", id: { not: submission.id } },
      orderBy: { submittedAt: "asc" },
      select: { id: true },
    })
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={backHref} aria-label={manager ? "Retour aux copies de l'examen" : "Retour au contenu de la formation"} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-500">{submission.folder.formation.name} · {submission.folder.name}</p>
          <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">Copie de {studentName}</h1>
        </div>
        {nextPending && (
          <Link href={`/${locale}/dashboard/paid-formations/${id}/submissions/${nextPending.id}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            Copie suivante à corriger<ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PaidFormationResourceViewer
          resourceId={submission.id}
          title={`Copie de ${studentName}`}
          mimeType={submission.mimeType}
          userName={session.user.name?.trim() || studentName}
          driveFileId={submission.driveFileId}
          streamUrl={`/api/paid-formations/submissions/${submission.id}/stream`}
        />

        <aside className="space-y-4 rounded-md border border-slate-200 p-4 dark:border-slate-700 lg:self-start">
          <div className="space-y-1.5">
            <ExamSubmissionStatus submission={submission} />
            <p className="text-xs text-slate-500">Soumise le {formatSubmissionDate(submission.submittedAt)}</p>
          </div>
          {canGrade ? (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">{submission.status === "GRADED" ? "Modifier la note" : "Noter la copie"}</h2>
              <ExamGradeForm key={`${submission.id}-${submission.grade}`} submission={submission} />
            </div>
          ) : submission.status === "GRADED" && submission.remarks ? (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Remarques</h2>
              <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{submission.remarks}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
