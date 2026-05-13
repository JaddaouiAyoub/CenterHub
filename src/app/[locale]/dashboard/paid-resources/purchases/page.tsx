import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPaidResourcePurchases } from "@/actions/paidResources";
import { PurchaseTable } from "@/components/dashboard/paid-resources/PurchaseTable";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function PurchasesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  if (!["ADMIN", "SECRETARY"].includes(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const result = await getPaidResourcePurchases({
    page: Number(sp.page) || 1,
    pageSize: 10,
    search: sp.search,
    status: sp.status as any,
    method: sp.method as any,
  });

  if ("error" in result) {
    return <div className="text-red-500 p-4">{result.error}</div>;
  }

  const { purchases, total, totalPages, page } = result;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${locale}/dashboard/paid-resources`}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Achats de ressources</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 pl-7">
            Consultez et gérez les achats des ressources payantes
          </p>
        </div>
      </div>

      <PurchaseTable
        purchases={purchases as any}
        total={total}
        totalPages={totalPages}
        page={page}
      />
    </div>
  );
}
