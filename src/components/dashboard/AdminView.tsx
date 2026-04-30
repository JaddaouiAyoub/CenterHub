"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { useParams, useRouter } from "next/navigation";
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  TrendingUp,
  Activity,
  ArrowUpRight,
  CreditCard,
  Calendar,
  School,
  PlusCircle,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { getDashboardStats } from "@/actions/stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function AdminView({ user }: { user: User }) {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Initialisation de la console d'administration...</p>
      </div>
    );
  }

  const statsData = data?.stats || {};
  const recentPayments = data?.recentPayments || [];

  const statsCards = [
    { title: "Total Étudiants", value: statsData.studentCount?.toLocaleString() || "0", icon: Users, color: "blue", bg: "bg-blue-50", description: "Inscrits actifs" },
    { title: "Enseignants", value: statsData.teacherCount?.toLocaleString() || "0", icon: GraduationCap, color: "indigo", bg: "bg-indigo-50", description: "Corps enseignant" },
    { title: "Paiement Total", value: `${(statsData.totalRevenue || 0).toLocaleString()} DHS`, icon: Wallet, color: "emerald", bg: "bg-emerald-50", description: "Revenus encaissés" },
    { title: "Classes / Matières", value: `${statsData.classCount || 0} / ${statsData.subjectCount || 0}`, icon: School, color: "orange", bg: "bg-orange-50", description: "Organisation" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-6"
    >
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-none px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Panneau d'Administration
            </Badge>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Console <span className="text-blue-400">Admin</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium max-w-md">
              Supervisez l'ensemble de l'établissement et suivez la croissance de votre centre.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-10 text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
              onClick={() => router.push(`/${locale}/dashboard/payments`)}
            >
              <Wallet className="w-4 h-4 mr-2" /> Gérer Paiements
            </Button>
            <Button 
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl px-5 h-10 text-sm font-bold backdrop-blur-sm transition-all"
              onClick={() => router.push(`/${locale}/dashboard/notifications`)}
            >
              <Activity className="w-4 h-4 mr-2" /> Notifications
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsCards.map((stat, i) => (
          <motion.div key={i} variants={item} whileHover={{ y: -4 }} className="group">
            <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg group-hover:bg-slate-100 transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{stat.value}</h3>
                  <p className="text-slate-500 font-bold text-[13px] mt-1.5">{stat.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  Facturation Récente
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Transactions financières en temps réel.</p>
              </div>
              <Button variant="ghost" className="text-blue-600 font-bold text-xs hover:bg-blue-50 rounded-lg px-3 h-8" onClick={() => router.push(`/${locale}/dashboard/payments`)}>
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentPayments.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 italic">Aucune transaction.</p>
                </div>
              ) : (
                recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-slate-900">{p.student.user.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{new Date(p.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{p.amount} DHS</p>
                      <Badge variant={p.status === "PAID" ? "success" : "secondary"} className="text-[9px] font-black h-4 px-2 rounded-full mt-0.5">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-900 to-blue-900 text-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white/10 rounded-lg">
                <Activity className="w-4 h-4 text-blue-300" />
              </div>
              <CardTitle className="text-lg font-black">Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-300" />
                    <span className="text-[13px] font-bold">Cours</span>
                  </div>
                  <span className="text-base font-black text-blue-400">{statsData.courseCount || 0}</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-[75%] rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <School className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-[13px] font-bold">Occupation</span>
                  </div>
                  <span className="text-base font-black text-emerald-400">{statsData.classCount || 0}</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[60%] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Objectif Mensuel</h4>
                <span className="text-[10px] font-bold text-blue-300">85%</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">En bonne voie.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
