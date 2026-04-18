"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { useParams, useRouter } from "next/navigation";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  FolderOpen,
  ChevronRight
} from "lucide-react";
import { getDashboardStats } from "@/actions/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SecretaryView({ user }: { user: User }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  useEffect(() => {
    const fetchData = async () => {
      const res = await getDashboardStats();
      if (res.stats) setData(res);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 italic">Chargement du tableau de bord...</div>;

  const stats = data?.stats || {};
  const recentPayments = data?.recentPayments || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord Secrétariat</h1>
          <p className="text-slate-500 mt-1">Aperçu global de l'activité du centre.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200"
            onClick={() => router.push(`/${locale}/dashboard/resources`)}
          >
            <FolderOpen className="w-4 h-4 mr-2" /> Gérer Ressources
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Étudiants</p>
                <h3 className="text-2xl font-bold mt-1">{stats.studentCount || 0}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Effectif total des inscrits
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Enseignants</p>
                <h3 className="text-2xl font-bold mt-1">{stats.teacherCount || 0}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Corps enseignant actif</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Cours / Sessions</p>
                <h3 className="text-2xl font-bold mt-1">{stats.courseCount || 0}</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">{stats.subjectCount} matières réparties</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Revenus (Paiements)</p>
                <h3 className="text-2xl font-bold mt-1">{(stats.totalRevenue || 0).toLocaleString()} <span className="text-sm font-normal">DHS</span></h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Total encaissé à ce jour</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group bg-indigo-50 border-indigo-100" onClick={() => router.push(`/${locale}/dashboard/resources`)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Ressources</p>
                <h3 className="text-2xl font-bold mt-1 text-indigo-900">Gérer</h3>
              </div>
              <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <FolderOpen className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-indigo-500 mt-4 flex items-center group-hover:translate-x-1 transition-transform font-medium">
              Cours & Supports <ChevronRight className="w-3 h-3 ml-1" />
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Flux de Facturation Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Aucune transaction récente.</p>
                ) : (
                  recentPayments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 bg-slate-50/30">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-md shadow-sm">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p.student.user.name}</p>
                          <p className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{p.amount} DHS</p>
                        <Badge variant={p.status === "PAID" ? "success" : "secondary"} className="text-[10px] h-4">
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-amber-400" /> Alertes de Gestion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Pointage manquant</p>
                  <p className="text-xs text-slate-400 mt-1">2 cours n'ont pas encore de feuilles de présence pour aujourd'hui.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Inscriptions terminées</p>
                  <p className="text-xs text-slate-400 mt-1">Toutes les nouvelles inscriptions ont été traitées avec succès.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


