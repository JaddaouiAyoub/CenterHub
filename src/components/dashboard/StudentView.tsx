"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  Activity,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Sparkles,
  BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getStudentProfileByUserId } from "@/actions/students";
import { getStudentAttendanceHistory } from "@/actions/attendance";
import { getStudentPayments } from "@/actions/payments";
import { getUnreadSubjectResourcesCount } from "@/actions/subjectResources";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function StudentView({ user }: { user: User }) {
  const params = useParams();
  const locale = params.locale as string;
  const base = `/${locale}/dashboard`;

  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [unreadResources, setUnreadResources] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user.id) return;
      const studentProfile = await getStudentProfileByUserId(user.id);
      setProfile(studentProfile);
      if (studentProfile) {
        const [attRes, payRes, unreadRes] = await Promise.all([
          getStudentAttendanceHistory(studentProfile.id),
          getStudentPayments(studentProfile.id),
          getUnreadSubjectResourcesCount(user.id)
        ]);
        if (attRes.attendance) setAttendance(attRes.attendance);
        if (payRes.payments) setPayments(payRes.payments);
        setUnreadResources(unreadRes);
      }
      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Chargement de votre espace...</p>
      </div>
    );
  }

  const courses = profile?.classes?.flatMap((c: any) => c.courses) || [];
  const totalAbsences = attendance.filter(a => a.status === "ABSENT").length;
  const totalLates   = attendance.filter(a => a.status === "LATE").length;
  const totalPresent = attendance.filter(a => a.status === "PRESENT").length;
  const attendanceRate = attendance.length > 0
    ? Math.round((totalPresent / attendance.length) * 100)
    : 100;

  const pendingPayments = payments.filter(p => p.status === "PENDING" || p.status === "PARTIAL");
  const totalPaid = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  // Today's courses
  const todayDay = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayCourses = courses.filter((c: any) => c.day === todayDay);

  // Upcoming absences (last 3)
  const recentAttendance = attendance.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ─── Hero Header ────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Espace Étudiant</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Bonjour, {user.name?.split(" ")[0]} 👋</h1>
            <p className="text-blue-200 mt-2 font-medium">
              {profile?.classes?.[0]?.name
                ? `Classe : ${profile.classes.map((c: any) => c.name).join(", ")}`
                : "Aucune classe assignée"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`${base}/schedule`}>
              <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm font-bold rounded-xl h-11 px-5 transition-all">
                <Calendar className="w-4 h-4 mr-2" /> Mon Emploi
              </Button>
            </Link>
            <Link href={`${base}/resources`}>
              <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl h-11 px-5 shadow-lg transition-all">
                <FileText className="w-4 h-4 mr-2" /> Mes Documents
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── KPI Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Link href={`${base}/schedule`}>
          <Card className="border-none shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cours</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{courses.length}</h3>
                  <p className="text-blue-600 text-xs mt-3 flex items-center font-bold">
                    <Activity className="w-3 h-3 mr-1" /> Par semaine
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${base}/attendance`}>
          <Card className="border-none shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Assiduité</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{attendanceRate}<span className="text-xl">%</span></h3>
                  <p className="text-emerald-500 text-xs mt-3 flex items-center font-bold">
                    <TrendingUp className="w-3 h-3 mr-1" /> Taux de présence
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all text-emerald-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${base}/attendance`}>
          <Card className="border-none shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Absences</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">
                    {totalAbsences}
                    <span className="text-slate-300 text-xl"> / {totalLates}</span>
                  </h3>
                  <p className="text-red-500 text-xs mt-3 flex items-center font-bold">
                    <Clock className="w-3 h-3 mr-1" /> Abs / Retards
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${base}/payments`}>
          <Card className="border-none shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Paiements</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{totalPaid.toFixed(0)}<span className="text-lg text-slate-400 font-normal"> DHS</span></h3>
                  {pendingPayments.length > 0 ? (
                    <p className="text-amber-500 text-xs mt-3 flex items-center font-bold">
                      <AlertCircle className="w-3 h-3 mr-1" /> {pendingPayments.length} en attente
                    </p>
                  ) : (
                    <p className="text-emerald-500 text-xs mt-3 flex items-center font-bold">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> À jour
                    </p>
                  )}
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all text-amber-500">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─── Main content grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left col — Today's courses + course list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's schedule */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Aujourd'hui</p>
                <h3 className="text-white font-black text-lg">
                  {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
              </div>
              <Link href={`${base}/schedule`}>
                <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold text-xs rounded-xl">
                  Semaine <ArrowRight className="w-3 h-3 ml-1.5" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {todayCourses.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex p-4 bg-slate-50 rounded-2xl mb-3">
                    <GraduationCap className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">Pas de cours aujourd'hui 🎉</p>
                </div>
              ) : (
                todayCourses.map((c: any, i: number) => (
                  <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50/50 group transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-black opacity-70 leading-none">DÉB</span>
                        <span className="text-sm font-black leading-none">{c.startTime?.substring(0, 5)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <Badge className="bg-blue-100 text-blue-700 border-none text-[10px] font-bold">{c.subject?.name}</Badge>
                          <span className="text-[10px] text-slate-400 font-medium">M. {c.teacher?.user?.name}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{c.startTime} - {c.endTime}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Full schedule preview */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-blue-600" /> Tous les Cours
              </h3>
              <Link href={`${base}/schedule`}>
                <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs hover:bg-blue-50 rounded-xl">
                  Voir emploi du temps <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {courses.slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/40 group transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-9 h-9 bg-slate-100 group-hover:bg-blue-600 text-slate-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all">
                      <span className="text-xs font-black">{DAYS[(c.day + 6) % 7]?.substring(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{c.subject?.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{c.startTime} – {c.endTime} • {c.teacher?.user?.name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 font-bold">
                    {DAYS[(c.day + 6) % 7]}
                  </Badge>
                </div>
              ))}
              {courses.length === 0 && (
                <p className="p-8 text-center text-slate-400 italic text-sm">Aucun cours trouvé.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right col — Attendance + Payments + Resources */}
        <div className="space-y-6">

          {/* Attendance summary */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 flex items-center">
                <Activity className="w-5 h-5 mr-3 text-emerald-600" /> Assiduité récente
              </h3>
              <Link href={`${base}/attendance`}>
                <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-xs hover:bg-emerald-50 rounded-xl">
                  Tout voir <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {recentAttendance.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-sm italic">Aucun historique.</p>
              ) : (
                recentAttendance.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="min-w-0 flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        a.status === "PRESENT" ? "bg-emerald-500" :
                        a.status === "ABSENT"  ? "bg-red-500" : "bg-amber-400"
                      }`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate">{a.course?.subject?.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">{new Date(a.date).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <Badge className={`text-[9px] font-black border-none shrink-0 ${
                      a.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                      a.status === "ABSENT"  ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {a.status === "PRESENT" ? "Présent" : a.status === "ABSENT" ? "Absent" : "Retard"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Pending payments alert */}
          {pendingPayments.length > 0 && (
            <Link href={`${base}/payments`}>
              <Card className="border-none shadow-sm rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 bg-amber-100 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-amber-900">Paiement(s) en attente</h4>
                      <p className="text-amber-700 text-xs mt-1 font-medium">
                        {pendingPayments.length} paiement(s) nécessite(nt) votre attention.
                      </p>
                      <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-8">
                        Voir les détails <ArrowRight className="w-3 h-3 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Resources quick access */}
          <Link href={`${base}/resources`}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden relative">
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <FileText className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-lg leading-tight truncate">Documents & Supports</h4>
                    <p className="text-blue-200 text-xs font-medium truncate">Cours et matériaux pédagogiques</p>
                  </div>
                  {unreadResources > 0 && (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold border-none shadow-lg animate-pulse">
                      {unreadResources} NOUVEAU
                    </Badge>
                  )}
                </div>
                <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs uppercase tracking-widest h-10 rounded-xl border-none shadow-none">
                  Accéder aux ressources <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
