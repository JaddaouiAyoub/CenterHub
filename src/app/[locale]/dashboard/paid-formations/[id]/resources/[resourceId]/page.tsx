import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { verifyStudentFormationPurchase } from "@/lib/paid-formations";
import { PaidFormationResourceViewer } from "@/components/dashboard/paid-formations/PaidFormationResourceViewer";

interface Props {
  params: Promise<{ locale: string; id: string; resourceId: string }>;
}

export default async function PaidFormationResourcePage({ params }: Props) {
  const { locale, id, resourceId } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const manager = ["ADMIN", "TEACHER", "SECRETARY"].includes(session.user.role);
  if (!manager && session.user.role !== "STUDENT") redirect(`/${locale}/dashboard`);

  const resource = await prisma.paidFormationResource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      title: true,
      mimeType: true,
      status: true,
      folder: {
        select: {
          formationId: true,
          formation: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });

  if (!resource || resource.folder.formationId !== id) notFound();
  if (!manager) {
    if (resource.status !== "PUBLISHED" || resource.folder.formation.status !== "PUBLISHED") notFound();
    if (!session.user.id) notFound();
    const hasAccess = await verifyStudentFormationPurchase(session.user.id, id);
    if (!hasAccess) notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/dashboard/paid-formations/${id}`} aria-label="Retour au contenu de la formation" className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{resource.folder.formation.name}</p>
          <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">{resource.title}</h1>
        </div>
      </div>
      <PaidFormationResourceViewer resourceId={resource.id} title={resource.title} mimeType={resource.mimeType} userName={session.user.name?.trim() || "Étudiant"} />
    </div>
  );
}
