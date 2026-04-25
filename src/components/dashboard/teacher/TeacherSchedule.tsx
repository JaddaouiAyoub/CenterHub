"use client";

import { useState, useEffect } from "react";
import { getTeacherSchedule } from "@/actions/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Plus
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { ResourceManager } from "./ResourceManager";


const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function TeacherSchedule({ teacherProfileId }: { teacherProfileId: string }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper: Get start of the week for a given date (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);

  const goToPreviousWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateLabel = (d: Date) => {
    return d.toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDayDate = (dayIndex: number) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + dayIndex);
    return d;
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await getTeacherSchedule(teacherProfileId, startOfWeek);
        if (res.courses) {
          setCourses(res.courses);
        } else {
          toast.error(res.error || "Erreur de chargement de l'emploi du temps");
        }
      } catch (error) {
        toast.error("Échec de la récupération des données");
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [teacherProfileId, currentDate]); // Refetch on date change

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Chargement de votre emploi du temps...</p>
      </div>
    );
  }

  // Group courses by day
  const scheduleByDay: Record<number, any[]> = {};
  courses.forEach(c => {
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
            <h2 className="text-xl font-bold text-slate-900">Emploi du Temps</h2>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Semaine du {formatDateLabel(startOfWeek)}</p>
          </div>
        </div>
        
        <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek} className="h-9 w-9 text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" onClick={goToToday} className="mx-2 px-4 h-9 font-bold text-xs uppercase tracking-widest text-slate-700 hover:bg-white rounded-lg transition-all">
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextWeek} className="h-9 w-9 text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {DAYS.map((dayName, index) => {
          const dbDayIndex = (index + 1) % 7;
          const dayDate = getDayDate(index);
          const isToday = dayDate.toDateString() === new Date().toDateString();
          const dayCourses = scheduleByDay[dbDayIndex] || [];
          
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
                {dayCourses.length === 0 ? (
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
                        <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[10px]">
                          {c.subject?.name}
                        </Badge>
                        <div className="text-[10px] font-bold text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {c.startTime} - {c.endTime}
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{c.name}</h4>
                      <div className="flex items-center text-[11px] text-slate-500 space-x-2">
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {c.class?.name}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        {c.meetingLink && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-8 text-[11px] text-blue-600 border-blue-100 hover:bg-blue-50"
                            onClick={() => window.open(c.meetingLink, '_blank')}
                          >
                            <Video className="w-3 h-3 mr-2" /> Rejoindre la séance
                          </Button>
                        )}
                        
                        <Dialog>
                          <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full h-8 text-[11px] text-slate-600 border-slate-100 hover:bg-slate-50")}>
                            <FileText className="w-3 h-3 mr-2" /> Documents et Supports
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Supports de cours : {c.name}</DialogTitle>
                            </DialogHeader>
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
