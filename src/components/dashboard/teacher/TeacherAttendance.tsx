"use client";

import { useState, useEffect } from "react";
import { getTeacherSchedule } from "@/actions/courses";
import { getStudentsForCourse, markAttendance, getAttendanceByCourse } from "@/actions/attendance";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Search, Calendar as CalendarIcon, Users, BookOpenCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function TeacherAttendance({ teacherProfileId }: { teacherProfileId: string }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await getTeacherSchedule(teacherProfileId);
      if (res.courses) setCourses(res.courses);
      setLoadingSchedule(false);
    };
    fetchCourses();
  }, [teacherProfileId]);

  const handleSearch = async () => {
    if (!selectedCourse || !selectedDate) return;
    setLoading(true);
    try {
      const [sData, aData] = await Promise.all([
        getStudentsForCourse(selectedCourse),
        getAttendanceByCourse(selectedCourse, new Date(selectedDate))
      ]);

      if (sData.students) {
        setStudents(sData.students);
        const records: Record<string, string> = {};
        aData.attendance?.forEach((a: any) => {
          records[a.studentId] = a.status;
        });
        setAttendanceRecords(records);
      }
    } catch (error) {
      toast.error("Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async (studentId: string, status: string) => {
    if (!selectedCourse) return;
    const res = await markAttendance(selectedCourse, studentId, status, selectedDate);
    if (res.success) {
      setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
      toast.success("Statut mis à jour");
    } else {
      toast.error("Échec de la mise à jour");
    }
  };

  if (loadingSchedule) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <BookOpenCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Ma Gestion des Présences</h2>
              <p className="text-blue-100 text-sm">Pointez la présence pour vos cours assignés.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Date du cours</Label>
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-slate-200 focus:ring-blue-500 rounded-lg h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Sélectionner une séance</Label>
            <Select onValueChange={(val) => setSelectedCourse(val)} value={selectedCourse || undefined}>
              <SelectTrigger className="border-slate-200 focus:ring-blue-500 rounded-lg h-11 text-slate-700">
                <SelectValue placeholder="Choisir un cours">
                  {selectedCourse ? (
                    (() => {
                      const course = courses.find(c => c.id.toString() === selectedCourse.toString());
                      return course ? `${course.subject.name} - ${course.class.name} (${course.startTime})` : selectedCourse;
                    })()
                  ) : "Choisir un cours"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.subject.name} - {c.class.name} ({c.startTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={!selectedCourse}
            className="bg-blue-600 hover:bg-blue-700 h-11 rounded-lg text-white font-medium shadow-sm"
          >
            <Search className="w-4 h-4 mr-2" /> Charger la liste d'appel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Récupération des élèves...</p>
        </div>
      ) : students.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 py-4">Étudiant</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 text-center">Statut</TableHead>
                <TableHead className="text-right font-semibold text-slate-700 py-4 pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold">
                        {s.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.user.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tight">ID: {s.id.slice(-6)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {attendanceRecords[s.id] ? (
                      <Badge className={`
                        px-3 py-1 rounded-full text-[10px] font-bold border-none
                        ${attendanceRecords[s.id] === "PRESENT" ? "bg-emerald-100 text-emerald-700" : ""}
                        ${attendanceRecords[s.id] === "ABSENT" ? "bg-red-100 text-red-700" : ""}
                        ${attendanceRecords[s.id] === "LATE" ? "bg-amber-100 text-amber-700" : ""}
                      `}>
                        {attendanceRecords[s.id] === "PRESENT" ? "PRÉSENT" : 
                         attendanceRecords[s.id] === "ABSENT" ? "ABSENT" : "RETARD"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-300 border-slate-200 text-[10px] uppercase">
                        En attente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant={attendanceRecords[s.id] === "PRESENT" ? "default" : "outline"}
                        className={attendanceRecords[s.id] === "PRESENT" ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-slate-100"}
                        onClick={() => handleMark(s.id, "PRESENT")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Présent
                      </Button>
                      <Button 
                        size="sm" 
                        variant={attendanceRecords[s.id] === "ABSENT" ? "destructive" : "outline"}
                        className={attendanceRecords[s.id] === "ABSENT" ? "" : "text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-100"}
                        onClick={() => handleMark(s.id, "ABSENT")}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Absent
                      </Button>
                      <Button 
                        size="sm" 
                        variant={attendanceRecords[s.id] === "LATE" ? "secondary" : "outline"}
                        className={attendanceRecords[s.id] === "LATE" ? "bg-amber-500 text-white hover:bg-amber-600" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-slate-100"}
                        onClick={() => handleMark(s.id, "LATE")}
                      >
                        <Clock className="w-4 h-4 mr-1.5" /> Retard
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : selectedCourse && !loading && (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Users className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-medium">Aucun étudiant trouvé pour cette liste.</p>
        </div>
      )}
    </div>
  );
}
