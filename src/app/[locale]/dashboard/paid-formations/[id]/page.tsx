import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import prisma from "@/lib/prisma";
import { verifyStudentFormationPurchase } from "@/lib/paid-formations";
import { PaidFormationManager } from "@/components/dashboard/paid-formations/PaidFormationManager";
import { PaidFormationStudentContents } from "@/components/dashboard/paid-formations/PaidFormationStudentContents";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PaidFormationDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  const role = session.user.role;
  const canManage = ["ADMIN", "TEACHER", "SECRETARY"].includes(role);
  if (!canManage && role !== "STUDENT") redirect(`/${locale}/dashboard`);

  const formation = await prisma.paidFormation.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      status: true,
      folders: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          parentId: true,
          _count: { select: { children: true, resources: true } },
          resources: {
            where: canManage ? undefined : { status: "PUBLISHED" },
            orderBy: { createdAt: "asc" },
            select: { id: true, title: true, description: true, type: true, status: true },
          },
        },
      },
    },
  });

  if (!formation || (!canManage && formation.status !== "PUBLISHED")) notFound();
  const hasAccess = canManage || Boolean(
    session.user.id && await verifyStudentFormationPurchase(session.user.id, formation.id)
  );
  const folders = formation.folders.map((folder) => ({
    ...folder,
    resources: folder.resources.map((resource) => ({ ...resource, folderId: folder.id })),
  }));
  const resources = folders.flatMap((folder) => folder.resources.map((resource) => ({
    id: resource.id,
    folderId: folder.id,
    title: resource.title,
    type: resource.type,
    status: resource.status,
  })));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 border-b border-slate-200 pb-5 dark:border-slate-700">
        <Link href={`/${locale}/dashboard/paid-formations`} aria-label="Retour aux formations" className="mt-0.5 rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{formation.name}</h1>
          {formation.description && <p className="mt-1 text-sm text-slate-500">{formation.description}</p>}
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{formation.price.toLocaleString("fr-MA")} MAD</p>
        </div>
        {canManage && <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{formation.status}</span>}
      </div>

      {canManage ? (
        <PaidFormationManager
          formationId={formation.id}
          formationStatus={formation.status}
          folders={folders.map(({ id, name, parentId, _count }) => ({
            id,
            name,
            parentId,
            canDelete: _count.children === 0 && _count.resources === 0,
          }))}
          resources={resources}
        />
      ) : (
        <>
          {!hasAccess && (
            <div className="flex items-start gap-3 border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Les ressources sont verrouillées. L’accès sera activé après l’enregistrement manuel de votre paiement par l’administration.</p>
            </div>
          )}
          <PaidFormationStudentContents formationId={formation.id} folders={folders} hasAccess={hasAccess} locale={locale} />
        </>
      )}
    </div>
  );
}
