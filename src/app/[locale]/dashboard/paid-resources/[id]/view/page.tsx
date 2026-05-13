import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { verifyStudentPurchase } from "@/actions/paidResources";
import { ResourceViewer } from "@/components/dashboard/paid-resources/ResourceViewer";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ResourceViewerPage({ params }: Props) {
  const { locale, id } = await params;

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const resource = await prisma.paidResource.findUnique({
    where: { id },
    select: { id: true, title: true, mimeType: true, status: true, type: true },
  });

  const isAdmin = ["ADMIN", "TEACHER", "SECRETARY"].includes(session.user.role);

  if (!resource) notFound();
  if (!isAdmin && resource.status !== "PUBLISHED") notFound();

  // Verify access if student
  if (session.user.role === "STUDENT") {
    const studentId = session.user.id;
    if (!studentId) redirect(`/${locale}/login`);

    const hasAccess = await verifyStudentPurchase(studentId, resource.id);
    if (!hasAccess) {
      return (
        <div className="p-8 text-center text-red-500">
          Vous n'avez pas accès à cette ressource. Veuillez l'acheter d'abord.
        </div>
      );
    }
  } else if (!["ADMIN", "TEACHER", "SECRETARY"].includes(session.user.role)) {
    return <div className="p-8 text-center text-red-500">Accès refusé.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/dashboard/paid-resources`}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">
          {resource.title}
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 sm:p-4 shadow-sm">
        <ResourceViewer
          resourceId={resource.id}
          mimeType={resource.mimeType}
          title={resource.title}
          userName={session.user.name || "Étudiant"}
          type={resource.type}
        />
      </div>
    </div>
  );
}
