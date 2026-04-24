"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  FileText
} from "lucide-react";
import { getStudentSchedule } from "@/actions/students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ResourceManager } from "../teacher/ResourceManager";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function StudentSchedule({ profile }: { profile: any }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const result = new Date(date.setDate(diff));
    result.setHours(0, 0, 0, 0); // Normalize to midnight
    return result;
  };

  const startOfWeek = getStartOfWeek(currentDate);

  const getDayDate = (dayIndex: number) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + dayIndex);
    return d;
  };

  const formatDateLabel = (d: Date) => {
    return d.toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await getStudentSchedule(profile?.user?.id, startOfWeek);
        if (res.courses) {
          setCourses(res.courses);
        } else {
          toast.error(res.error || "Erreur de chargement de l'emploi du temps");
        }
      } catch (error) {
        toast.error("Échec de la récupération des données");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (profile?.user?.id) fetchSchedule();
  }, [profile?.user?.id, currentDate]);

  // Group student courses by day
  const scheduleByDay: Record<number, any[]> = {};
  courses.forEach((c: any) => {
    if (!scheduleByDay[c.day]) scheduleByDay[c.day] = [];
    scheduleByDay[c.day].push(c);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mon Emploi du Temps</h2>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Semaine du {formatDateLabel(startOfWeek)}</p>
          </div>
        </div>
        
        <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <Button variant="ghost" size="icon" onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 7);
            setCurrentDate(d);
          }} className="h-9 w-9 text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="mx-2 px-4 h-9 font-bold text-xs uppercase tracking-widest text-slate-700 hover:bg-white rounded-lg transition-all">
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 7);
            setCurrentDate(d);
          }} className="h-9 w-9 text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {DAYS.map((dayName, index) => {
          const dayIndex = index;
          const dayDate = getDayDate(index);
          const isToday = dayDate.toDateString() === new Date().toDateString();
          const dayCourses = scheduleByDay[dayIndex] || [];
          
          return (
            <Card key={dayName} className={`
              border-none shadow-sm transition-all duration-300
              ${isToday ? "bg-white ring-2 ring-blue-500/20 shadow-blue-100/50" : "bg-white/50"}
            `}>
              <CardHeader className={`p-4 border-b pb-3 ${isToday ? "bg-blue-50/50" : "border-slate-50"}`}>
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between text-slate-400">
                  <span className={isToday ? "text-blue-700 font-black" : ""}>{dayName}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isToday ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {dayDate.getDate()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {loading ? (
                  <div className="py-8 text-center flex flex-col items-center">
                    <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2" />
                    <p className="text-[10px] text-slate-400">Chargement...</p>
                  </div>
                ) : dayCourses.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-slate-400 italic">Pas de cours</p>
                  </div>
                ) : (
                  dayCourses.map((c, i) => (
                    <div 
                      key={c.id} 
                      className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[10px] w-fit">
                            {c.subject?.name}
                          </Badge>
                          {c.recurrence === "ONCE" && (
                            <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px] h-4 w-fit">
                              SÉANCE UNIQUE
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {c.startTime}
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{c.name}</h4>
                      <div className="flex items-center text-[10px] text-slate-500 space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span>M. {c.teacher?.user?.name}</span>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        {c.meetingLink && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-8 text-[11px] text-blue-600 border-blue-100 hover:bg-blue-50 font-bold"
                            onClick={() => window.open(c.meetingLink, '_blank')}
                          >
                            <Video className="w-3 h-3 mr-2" /> Session en direct
                          </Button>
                        )}
                        
                        <Dialog>
                          <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full h-8 text-[11px] text-slate-600 border-slate-100 hover:bg-slate-50 font-bold")}>
                            <FileText className="w-3 h-3 mr-2" /> Documents
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Supports de cours : {c.name}</DialogTitle>
                            </DialogHeader>
                            {/* Read-only view effectively if we don't pass upload props, but ResourceManager handles its own state. 
                                In a real app we'd hide upload buttons for students. */}
                            <ResourceManager courseId={c.id} courseName={c.name} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
