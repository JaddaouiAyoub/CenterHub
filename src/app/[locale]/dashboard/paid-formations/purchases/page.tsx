import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import prisma from "@/lib/prisma";
import { getPaidFormationPurchases } from "@/actions/paidFormations";
import { PaidFormationPurchaseForm } from "@/components/dashboard/paid-formations/PaidFormationPurchaseForm";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function PaidFormationPurchasesPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  if (!["ADMIN", "SECRETARY"].includes(session.user.role)) redirect(`/${locale}/dashboard`);

  const [result, formations] = await Promise.all([
    getPaidFormationPurchases(),
    prisma.paidFormation.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, name: true, price: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-5 dark:border-slate-700">
        <Link href={`/${locale}/dashboard/paid-formations`} aria-label="Retour aux formations" className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paiements des formations</h1>
          <p className="mt-1 text-sm text-slate-500">Enregistrez les paiements reçus au centre.</p>
        </div>
      </header>

      <PaidFormationPurchaseForm formations={formations} />

      {"error" in result ? (
        <p className="py-8 text-center text-sm text-red-600">{result.error}</p>
      ) : result.purchases.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-sm text-slate-500"><Receipt className="h-8 w-8" />Aucun paiement enregistré.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700">
              <tr><th className="px-3 py-3">Étudiant</th><th className="px-3 py-3">Formation</th><th className="px-3 py-3">Montant</th><th className="px-3 py-3">Méthode</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {result.purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-3 py-3"><div className="font-medium text-slate-800 dark:text-slate-100">{purchase.student.user.name || "Étudiant"}</div><div className="text-xs text-slate-500">{purchase.student.user.email}</div></td>
                  <td className="px-3 py-3">{purchase.formation.name}</td>
                  <td className="px-3 py-3 font-semibold">{purchase.amountPaid.toLocaleString("fr-MA")} MAD</td>
                  <td className="px-3 py-3">{purchase.method === "CASH" ? "Espèces" : purchase.method === "CARD" ? "Carte" : "Virement"}</td>
                  <td className="px-3 py-3">{purchase.purchasedAt.toLocaleDateString("fr-MA")}</td>
                  <td className="px-3 py-3">{purchase.status === "COMPLETED" ? "Payé" : purchase.status === "PENDING" ? "En attente" : "Remboursé"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
