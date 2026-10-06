import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PaidFormationsDashboard } from "@/components/dashboard/paid-formations/PaidFormationsDashboard";
import { BookOpen, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function PaidFormationsPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const role = session.user.role;
  const canManage = ["ADMIN", "TEACHER", "SECRETARY"].includes(role);
  const canManagePayments = ["ADMIN", "SECRETARY"].includes(role);
  if (!canManage && role !== "STUDENT") redirect(`/${locale}/dashboard`);

  let studentId: string | null = null;
  if (role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    studentId = profile?.id ?? null;
  }

  const formations = await prisma.paidFormation.findMany({
    where: canManage ? undefined : { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      status: true,
      totalSales: true,
      totalRevenue: true,
      _count: { select: { folders: true, purchases: true } },
    },
  });

  const purchases = studentId
    ? await prisma.paidFormationPurchase.findMany({
        where: { studentId, status: "COMPLETED" },
        select: { formationId: true },
      })
    : [];
  const purchasedIds = new Set(purchases.map((purchase) => purchase.formationId));
  const visibleFormations = formations.map((formation) => ({
    ...formation,
    isPurchased: purchasedIds.has(formation.id),
  }));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-6 w-6 text-blue-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Formations payantes</h1>
            <p className="mt-1 text-sm text-slate-500">
              {canManage ? "Organisez les cours et gérez les accès par formation." : "Retrouvez les formations et leurs ressources."}
            </p>
          </div>
        </div>
        {canManagePayments && (
          <Link href={`/${locale}/dashboard/paid-formations/purchases`} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            <ShoppingCart className="h-4 w-4" />Paiements
          </Link>
        )}
      </header>
      <PaidFormationsDashboard formations={visibleFormations} canManage={canManage} />
    </div>
  );
}
