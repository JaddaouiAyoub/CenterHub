"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { useParams, useRouter } from "next/navigation";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  FolderOpen,
  ChevronRight,
  PlusCircle,
  Search,
  BookOpen,
  School
} from "lucide-react";
import { getDashboardStats } from "@/actions/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Chargement de votre espace de travail...</p>
      </div>
    );
  }

  const stats = data?.stats || {};

  const mainStats = [
    { 
      label: "Étudiants", 
      value: stats.studentCount || 0, 
      icon: GraduationCap, 
      color: "blue", 
      trend: "Inscrits actifs",
      href: `/${locale}/dashboard/students`
    },
    { 
      label: "Enseignants", 
      value: stats.teacherCount || 0, 
      icon: Users, 
      color: "indigo", 
      trend: "Corps pédagogique",
      href: `/${locale}/dashboard/teachers`
    },
    { 
      label: "Matières", 
      value: stats.subjectCount || 0, 
      icon: BookOpen, 
      color: "violet", 
      trend: "Programmes actifs",
      href: `/${locale}/dashboard/subjects`
    },
    { 
      label: "Classes", 
      value: stats.classCount || 0, 
      icon: School, 
      color: "emerald", 
      trend: "Groupes scolaires",
      href: `/${locale}/dashboard/classes`
    },
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
            <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-none px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Espace Secrétariat
            </Badge>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Bonjour, <span className="text-blue-400">{user.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm font-medium max-w-md">
              Gérez efficacement les activités quotidiennes et le suivi des étudiants.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-10 text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
              onClick={() => router.push(`/${locale}/dashboard/students`)}
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Nouvel Étudiant
            </Button>
            <Button 
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl px-5 h-10 text-sm font-bold backdrop-blur-sm transition-all"
              onClick={() => router.push(`/${locale}/dashboard/resources`)}
            >
              <FolderOpen className="w-4 h-4 mr-2" /> Ressources
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {mainStats.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={item}
            whileHover={{ y: -4 }}
            className="group"
          >
            <Card 
              className="border-none shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => router.push(stat.href)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center text-slate-300 group-hover:text-slate-500 transition-colors">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{stat.value}</h3>
                  <p className="text-slate-500 font-bold text-[13px] mt-1.5">{stat.label}</p>
                  <div className="flex items-center mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className={`w-1.5 h-1.5 rounded-full bg-${stat.color}-400 mr-2`} />
                    {stat.trend}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & News */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900">Actions Rapides</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Accédez directement aux modules essentiels.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Emploi du Temps", icon: Calendar, href: `/${locale}/dashboard/courses`, color: "bg-blue-50 text-blue-600" },
                { label: "Matières", icon: BookOpen, href: `/${locale}/dashboard/subjects`, color: "bg-purple-50 text-purple-600" },
                { label: "Classes", icon: School, href: `/${locale}/dashboard/classes`, color: "bg-emerald-50 text-emerald-600" },
                { label: "Présences", icon: CheckCircle2, href: `/${locale}/dashboard/attendance`, color: "bg-amber-50 text-amber-600" },
                { label: "Ressources", icon: FolderOpen, href: `/${locale}/dashboard/resources`, color: "bg-pink-50 text-pink-600" },
                { label: "Notifications", icon: AlertCircle, href: `/${locale}/dashboard/notifications`, color: "bg-indigo-50 text-indigo-600" },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => router.push(action.href)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                >
                  <div className={`p-2.5 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 mt-2.5">{action.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Alerts & Status */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl overflow-hidden h-full">
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <CardTitle className="text-lg font-black">Alertes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="p-1.5 rounded-md bg-amber-400/20 text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-white">Pointage manquant</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">2 cours n'ont pas de feuilles aujourd'hui.</p>
                  </div>
                </div>
              </div>

              <div className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="p-1.5 rounded-md bg-emerald-400/20 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-white">Inscriptions terminées</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Les inscriptions ont été traitées.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-blue-600/20 border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">Productivité</span>
                  <span className="text-[11px] font-bold text-blue-400">92%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "92%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                  />
                </div>
                <p className="text-[9px] text-blue-200/50 mt-2 font-medium">Performance globale.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}


