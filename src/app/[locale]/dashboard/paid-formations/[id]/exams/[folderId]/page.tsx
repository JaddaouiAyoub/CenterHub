import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, GraduationCap } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatGrade, formatSubmissionDate } from "@/lib/paid-formation-format";
import { ExamSubmissionsBoard } from "@/components/dashboard/paid-formations/PaidFormationExam";

interface Props {
  params: Promise<{ locale: string; id: string; folderId: string }>;
}

export default async function PaidFormationExamPage({ params }: Props) {
  const { locale, id, folderId } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  const role = session.user.role;
  if (!["ADMIN", "TEACHER", "SECRETARY"].includes(role)) redirect(`/${locale}/dashboard/paid-formations/${id}`);

  const folder = await prisma.paidFormationFolder.findFirst({
    where: { id: folderId, formationId: id, isExam: true },
    select: {
      name: true,
      formation: { select: { name: true, folders: { select: { id: true, name: true, parentId: true } } } },
      parentId: true,
      resources: {
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, status: true },
      },
      examSubmissions: {
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          status: true,
          grade: true,
          remarks: true,
          submittedAt: true,
          student: { select: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  });
  if (!folder) notFound();

  // Chemin du dossier dans l'arborescence (ex. Examen › Exam 1).
  const path: string[] = [folder.name];
  for (let parentId = folder.parentId; parentId;) {
    const parent = folder.formation.folders.find((item) => item.id === parentId);
    if (!parent) break;
    path.unshift(parent.name);
    parentId = parent.parentId;
  }

  const submissions = folder.examSubmissions.map(({ student, submittedAt, ...submission }) => ({
    ...submission,
    submittedAtLabel: formatSubmissionDate(submittedAt),
    studentName: student.user.name || student.user.email,
    studentEmail: student.user.email,
  }));
  const graded = submissions.filter((submission) => submission.status === "GRADED" && submission.grade !== null);
  const average = graded.length
    ? graded.reduce((sum, submission) => sum + (submission.grade ?? 0), 0) / graded.length
    : null;
  const stats = [
    { label: "Copies reçues", value: String(submissions.length) },
    { label: "En attente", value: String(submissions.length - graded.length) },
    { label: "Corrigées", value: String(graded.length) },
    { label: "Moyenne", value: formatGrade(average === null ? null : Math.round(average * 100) / 100) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 border-b border-slate-200 pb-5 dark:border-slate-700">
        <Link href={`/${locale}/dashboard/paid-formations/${id}`} aria-label="Retour au contenu de la formation" className="mt-0.5 rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-500">{folder.formation.name} · {path.join(" › ")}</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            <GraduationCap className="h-6 w-6 shrink-0 text-violet-600" />
            <span className="truncate">{folder.name}</span>
          </h1>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-slate-200 px-4 py-3 dark:border-slate-700">
            <dt className="text-xs text-slate-500">{stat.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {folder.resources.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Sujet</h2>
          <div className="flex flex-wrap gap-2">
            {folder.resources.map((resource) => (
              <Link key={resource.id} href={`/${locale}/dashboard/paid-formations/${id}/resources/${resource.id}`} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <FileText className="h-4 w-4 text-blue-700" />{resource.title}
                {resource.status !== "PUBLISHED" && <span className="text-xs text-slate-400">({resource.status})</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Copies soumises</h2>
        <ExamSubmissionsBoard
          formationId={id}
          submissions={submissions}
          canGrade={["ADMIN", "TEACHER"].includes(role)}
          locale={locale}
        />
      </section>
    </div>
  );
}
