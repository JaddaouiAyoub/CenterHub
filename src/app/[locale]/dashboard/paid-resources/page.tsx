import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPaidResources, getStudentPublishedResources } from "@/actions/paidResources";
import { PaidResourceTable } from "@/components/dashboard/paid-resources/PaidResourceTable";
import { StudentResourceTable } from "@/components/dashboard/paid-resources/StudentResourceTable";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, ShoppingCart, BarChart2 } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function PaidResourcesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const role = session.user.role;

  // ── STUDENT VIEW ──────────────────────────────────────────────────────────
  if (role === "STUDENT") {
    const result = await getStudentPublishedResources({
      page: Number(sp.page) || 1,
      pageSize: 10,
      search: sp.search,
    });

    if ("error" in result) {
      return <div className="text-red-500 p-4">{result.error}</div>;
    }

    const { resources, total, totalPages, page } = result;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ressources Payantes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {total} ressource{total !== 1 ? "s" : ""} disponible{total !== 1 ? "s" : ""}
          </p>
        </div>

        {resources.length === 0 && !sp.search ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <ShoppingCart className="w-12 h-12 text-slate-300" />
            <p className="text-slate-500 font-medium">Aucune ressource disponible pour le moment</p>
          </div>
        ) : (
          <StudentResourceTable 
            resources={resources as any}
            total={total}
            totalPages={totalPages}
            page={page}
          />
        )}
      </div>
    );
  }

  // ── ADMIN / TEACHER / SECRETARY VIEW ──────────────────────────────────────
  if (!["ADMIN", "TEACHER", "SECRETARY"].includes(role)) {
    redirect(`/${locale}/dashboard`);
  }

  const [resourcesResult, subjects, classes] = await Promise.all([
    getPaidResources({
      page: Number(sp.page) || 1,
      pageSize: 10,
      search: sp.search,
      subjectId: sp.subjectId,
      classId: sp.classId,
      type: sp.type as any,
      status: sp.status as any,
      sortBy: (sp.sortBy as any) || "createdAt",
      sortDir: (sp.sortDir as any) || "desc",
    }),
    prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if ("error" in resourcesResult) {
    return <div className="text-red-500 p-4">{resourcesResult.error}</div>;
  }

  const { resources, total, totalPages, page } = resourcesResult;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ressources Payantes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gérez vos ressources et suivez les ventes
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${locale}/dashboard/paid-resources/analytics`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BarChart2 className="w-4 h-4" /> Analytics
          </Link>
          <Link
            href={`/${locale}/dashboard/paid-resources/purchases`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" /> Achats
          </Link>
          <Link
            href={`/${locale}/dashboard/paid-resources/new`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle ressource
          </Link>
        </div>
      </div>

      <PaidResourceTable
        resources={resources as any}
        total={total}
        totalPages={totalPages}
        page={page}
        subjects={subjects}
        classes={classes}
      />
    </div>
  );
}
