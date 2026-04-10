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
  GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getStudentProfileByUserId } from "@/actions/students";
import { getStudentAttendanceHistory } from "@/actions/attendance";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";

export function StudentView({ user }: { user: User }) {
  const params = useParams();
  const locale = params.locale as string;
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user.id) return;
      const [studentProfile, attendanceData] = await Promise.all([
        getStudentProfileByUserId(user.id),
        getStudentAttendanceHistory(user.id) // This actually needs profile.id? Let's check.
      ]);
      
      // Wait, in my attendance.ts I used studentId. 
      // If user.id is the same as studentProfile.userId... 
      // Actually some places use studentProfile.id. 
      
      setProfile(studentProfile);
      
      // If we have profile, fetch attendance by profile.id
      if (studentProfile) {
        const res = await getStudentAttendanceHistory(studentProfile.id);
        if (res.attendance) setAttendance(res.attendance);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  if (loading) return <div className="p-12 text-center text-slate-500">Chargement de votre espace...</div>;

  const totalAbsences = attendance.filter(a => a.status === "ABSENT").length;
  const totalLates = attendance.filter(a => a.status === "LATE").length;
  const courses = profile?.classes?.flatMap((c: any) => c.courses) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Bienvenue, {user.name}</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Espace Étudiant & Parent</p>
        </div>
        <div className="flex items-center space-x-2">
            <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-tight">
                {profile?.classes?.[0]?.name || "Aucune classe"}
            </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-indigo-100 text-sm font-medium">Mes Cours</p>
            <h3 className="text-3xl font-black mt-2">{courses.length}</h3>
            <p className="text-indigo-100 text-xs mt-4 flex items-center font-bold uppercase tracking-tighter">
              <Activity className="w-3 h-3 mr-1" /> Sessions hebdomadaires
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden border-b-4 border-b-emerald-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">Assiduité</p>
                <h3 className="text-3xl font-black mt-2 text-slate-900">
                  {attendance.length > 0 ? Math.round(((attendance.length - totalAbsences) / attendance.length) * 100) : 100}%
                </h3>
                <p className="text-emerald-500 text-xs mt-4 flex items-center font-bold uppercase tracking-tighter">
                  <TrendingUp className="w-3 h-3 mr-1" /> Présence globale
                </p>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden border-b-4 border-b-red-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">Absences & Retards</p>
                <h3 className="text-3xl font-black mt-2 text-slate-900">{totalAbsences} <span className="text-slate-300 text-lg">/ {totalLates}</span></h3>
                <p className="text-red-500 text-xs mt-4 flex items-center font-bold uppercase tracking-tighter">
                  <Clock className="w-3 h-3 mr-1" /> Justificatifs requis
                </p>
              </div>
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black font-heading flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-blue-600" /> Mon Emploi du Temps
                </CardTitle>
                <Button variant="ghost" size="xs" className="text-blue-600 font-bold text-xs" render={
                   <Link href={`/${locale}/dashboard/schedule`}>Voir tout <ChevronRight className="w-4 h-4 ml-1" /></Link>
                } />
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-100">
                  {courses.slice(0, 4).map((c: any, i: number) => (
                    <div key={i} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center space-x-5">
                         <div className="w-12 h-12 flex flex-col items-center justify-center bg-slate-100 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                            <span className="text-[10px] font-black uppercase opacity-60">Jour</span>
                            <span className="text-lg font-black leading-none">{c.day + 1}</span>
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-900">{c.subject?.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {c.startTime} - {c.endTime} • Par {c.teacher?.user?.name}
                            </p>
                         </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic">Aucun cours trouvé.</div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-lg font-black font-heading flex items-center">
                   <Activity className="w-5 h-5 mr-3 text-emerald-600" /> Dernières Présences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 {attendance.slice(0, 5).map((a: any, i: number) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="min-w-0">
                         <p className="text-sm font-bold text-slate-900 truncate">{a.course?.subject?.name}</p>
                         <p className="text-[10px] text-slate-400 font-medium uppercase">{new Date(a.date).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <Badge className={`
                        px-2 py-0.5 rounded-full text-[9px] font-black border-none
                        ${a.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : ""}
                        ${a.status === "ABSENT" ? "bg-red-100 text-red-700" : ""}
                        ${a.status === "LATE" ? "bg-amber-100 text-amber-700" : ""}
                      `}>
                        {a.status}
                      </Badge>
                   </div>
                 ))}
                 {attendance.length === 0 && (
                   <p className="text-center py-6 text-slate-400 text-sm italic">Aucun historique d'appel.</p>
                 )}
              </CardContent>
           </Card>

           <Link href={`/${locale}/dashboard/resources`} className="block group">
              <Card className="border-none shadow-sm bg-blue-600 text-white rounded-2xl transform hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden">
                 <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <h4 className="font-black text-lg">Documents & Supports</h4>
                          <p className="text-blue-100 text-xs mt-1">Accédez à vos ressources de cours</p>
                       </div>
                       <FileText className="w-10 h-10 text-blue-300 opacity-50" />
                    </div>
                    <Button variant="secondary" className="w-full mt-6 bg-white text-blue-600 hover:bg-white/90 font-bold text-xs uppercase tracking-widest h-11 border-none shadow-none">
                       Consulter
                    </Button>
                 </CardContent>
              </Card>
           </Link>
        </div>
      </div>
    </div>
  );
}
