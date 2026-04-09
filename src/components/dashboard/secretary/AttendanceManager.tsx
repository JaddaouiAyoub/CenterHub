"use client";

import { useState, useEffect } from "react";
import { getCourses } from "@/actions/courses";
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
import { CheckCircle2, XCircle, Clock, Search, Calendar as CalendarIcon, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AttendanceManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await getCourses();
      if (res.courses) setCourses(res.courses);
    };
    fetchCourses();
  }, []);

  const handleSearch = async () => {
    if (!selectedCourse || !selectedDate) return;
    setLoading(true);
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
    setLoading(false);
  };

  const handleMark = async (studentId: string, status: string) => {
    if (!selectedCourse) return;
    const res = await markAttendance(selectedCourse, studentId, status, selectedDate);
    if (res.success) {
      setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Gestion des Absences</h2>
              <p className="text-indigo-100 text-sm">Suivi quotidien de la présence des étudiants.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Date de la session</Label>
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-slate-200 focus:ring-indigo-500 rounded-lg h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Cours / Session</Label>
            <Select onValueChange={(val) => setSelectedCourse(val)} value={selectedCourse || undefined}>
              <SelectTrigger className="border-slate-200 focus:ring-indigo-500 rounded-lg h-11">
                <SelectValue placeholder="Choisir un cours">
                  {(val: any) => val ? (courses.find(c => c.id?.toString() === val.toString()) ? `${courses.find(c => c.id?.toString() === val.toString())?.subject?.name} - ${courses.find(c => c.id?.toString() === val.toString())?.class?.name} (${courses.find(c => c.id?.toString() === val.toString())?.startTime})` : val) : "Choisir un cours"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id?.toString()} label={`${c.subject.name} - ${c.class.name} (${c.startTime})`}>
                    {c.subject.name} - {c.class.name} ({c.startTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSearch} 
            className="bg-indigo-600 hover:bg-indigo-700 h-11 rounded-lg text-white font-medium shadow-sm transition-all active:scale-95"
          >
            <Search className="w-4 h-4 mr-2" /> Rechercher les étudiants
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 animate-pulse font-medium">Chargement de la liste d'appel...</p>
        </div>
      ) : students.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 py-4">Étudiant</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 text-center">Statut Actuel</TableHead>
                <TableHead className="text-right font-semibold text-slate-700 py-4 pr-6">Pointer la présence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {s.user.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900">{s.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {attendanceRecords[s.id] ? (
                      <Badge className={`
                        px-3 py-1 rounded-full text-[11px] font-bold border-none
                        ${attendanceRecords[s.id] === "PRESENT" ? "bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-100" : ""}
                        ${attendanceRecords[s.id] === "ABSENT" ? "bg-red-100 text-red-700 shadow-sm shadow-red-100" : ""}
                        ${attendanceRecords[s.id] === "LATE" ? "bg-amber-100 text-amber-700 shadow-sm shadow-amber-100" : ""}
                      `}>
                        {attendanceRecords[s.id] === "PRESENT" ? "PRÉSENT" : 
                         attendanceRecords[s.id] === "ABSENT" ? "ABSENT" : "RETARD"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-300 border-slate-200 text-[10px] uppercase font-medium">
                        Non renseigné
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`
                          rounded-full px-4 h-9 font-medium transition-all
                          ${attendanceRecords[s.id] === "PRESENT" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}
                        `}
                        onClick={() => handleMark(s.id, "PRESENT")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Présent
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`
                          rounded-full px-4 h-9 font-medium transition-all
                          ${attendanceRecords[s.id] === "ABSENT" ? "bg-red-600 text-white hover:bg-red-700" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}
                        `}
                        onClick={() => handleMark(s.id, "ABSENT")}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Absent
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`
                          rounded-full px-4 h-9 font-medium transition-all
                          ${attendanceRecords[s.id] === "LATE" ? "bg-amber-500 text-white hover:bg-amber-600" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"}
                        `}
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
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
             <p className="text-xs text-slate-500">Les modifications sont enregistrées automatiquement après chaque clic.</p>
          </div>
        </div>
      ) : selectedCourse && !loading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-slate-900 font-bold text-lg">Aucun étudiant inscrit</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">Nous n'avons trouvé aucun étudiant assigné à cette classe ou ce cours.</p>
        </div>
      )}
    </div>
  );
}

