import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPaidResourceAnalytics } from "@/actions/paidResources";
import { AnalyticsDashboard } from "@/components/dashboard/paid-resources/AnalyticsDashboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function PaidResourcesAnalyticsPage({ params }: Props) {
  const { locale } = await params;

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  if (!["ADMIN", "SECRETARY"].includes(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const result = await getPaidResourceAnalytics();

  if ("error" in result) {
    return <div className="text-red-500 p-4">{result.error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href={`/${locale}/dashboard/paid-resources`}
          className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
            Statistiques des ressources payantes
          </p>
        </div>
      </div>

      <AnalyticsDashboard data={result.data} />
    </div>
  );
}
