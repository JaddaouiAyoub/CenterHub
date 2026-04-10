"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  Clock,
  ChevronRight,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getTeacherProfileByUserId } from "@/actions/teachers";
import { getTeacherSchedule } from "@/actions/courses";
import Link from "next/link";
import { useParams } from "next/navigation";

export function TeacherView({ user }: { user: User }) {
  const params = useParams();
  const locale = params.locale as string;
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCourse, setNextCourse] = useState<any>(null);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user.id) return;
      const profile = await getTeacherProfileByUserId(user.id);
      if (profile) {
        const res = await getTeacherSchedule(profile.id);
        if (res.courses) {
          setSchedule(res.courses);
          
          // Find next course (simple logic: first course of the day or first course overall)
          const today = new Date().getDay(); // 0=Sun, 1=Mon...
          // Our schema day is 0=Monday (let's assume based on component display)
          // Adjust if needed. 
          const currentDay = today === 0 ? 6 : today - 1; 
          
          const todaysCourses = res.courses.filter((c: any) => c.day === currentDay);
          if (todaysCourses.length > 0) {
            setNextCourse(todaysCourses[0]);
          } else {
            setNextCourse(res.courses[0]);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  if (loading) return <div className="p-12 text-center text-slate-500">Chargement...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bienvenue, {user.name}</h1>
        <p className="text-slate-500 mt-1">Gérez vos séances et le suivi de vos élèves.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium">Prochain cours</p>
                <h3 className="text-xl font-bold mt-1">
                  {nextCourse ? nextCourse.subject?.name : "Aucun cours"}
                </h3>
                <p className="text-blue-100 text-xs mt-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> {nextCourse ? `${nextCourse.startTime} aujourd'hui` : "Repos"}
                </p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">Mes Matières</p>
                <h3 className="text-xl font-bold mt-1 text-slate-900">
                  {Array.from(new Set(schedule.map(c => c.subjectId))).length}
                </h3>
                <p className="text-emerald-600 text-xs mt-2 flex items-center">
                  <Activity className="w-3 h-3 mr-1" /> Spécialisation active
                </p>
              </div>
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">Classes gérées</p>
                <h3 className="text-xl font-bold mt-1 text-slate-900">
                  {Array.from(new Set(schedule.map(c => c.classId))).length}
                </h3>
                <p className="text-blue-600 text-xs mt-2 flex items-center">
                  <Activity className="w-3 h-3 mr-1" /> Groupes assignés
                </p>
              </div>
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Aujourd'hui / Prochains Cours</CardTitle>
            <Link href={`/${locale}/dashboard/schedule`}>
              <Button variant="outline" size="sm">Tout voir</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.slice(0, 5).map((slot, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600 font-bold text-xs w-24 text-center">
                      Jour {slot.day + 1} - {slot.startTime}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{slot.subject?.name}</h4>
                      <p className="text-xs text-slate-500">{slot.name} • {slot.class?.name}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
              {schedule.length === 0 && (
                <p className="text-center py-8 text-slate-400 italic">Aucun cours assigné pour le moment.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Accès Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/${locale}/dashboard/attendance`} className="block">
              <div className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-3 text-indigo-700 font-bold">
                  <BookOpen className="w-5 h-5" />
                  <span>Pointer les absences</span>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href={`/${locale}/dashboard/schedule`} className="block">
              <div className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-3 text-emerald-700 font-bold">
                  <Calendar className="w-5 h-5" />
                  <span>Mon emploi du temps</span>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

