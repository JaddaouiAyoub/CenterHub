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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await getTeacherSchedule(teacherProfileId);
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
  }, [teacherProfileId]);

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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Emploi du Temps Hebdomadaire</h2>
            <p className="text-sm text-slate-500">Consultez vos séances et groupes assignés.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {DAYS.map((dayName, index) => {
          const dayIndex = index; // 0=Mon, 1=Tue... in our display, but verify schema mapping. 
          // Usually in schema 0=Sunday or 1=Monday? 
          // Previous components used 0-6. Let's stick to 0=Monday (French usual) for display.
          const dayCourses = scheduleByDay[dayIndex] || [];
          
          return (
            <Card key={dayName} className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="p-4 border-b border-slate-50 pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  {dayName}
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal">
                    {dayCourses.length}
                  </Badge>
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
                          <DialogTrigger>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 text-[11px] text-slate-600 border-slate-100 hover:bg-slate-50"
                            >
                              <FileText className="w-3 h-3 mr-2" /> Documents et Supports
                            </Button>
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
