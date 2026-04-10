"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getStudentAttendanceHistory } from "@/actions/attendance";

export function StudentAttendanceHistory({ profile }: { profile: any }) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await getStudentAttendanceHistory(profile.id);
      if (res.attendance) setAttendance(res.attendance);
      setLoading(false);
    };
    fetchHistory();
  }, [profile.id]);

  const filteredAttendance = attendance.filter(a => 
    a.course?.subject?.name.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    present: attendance.filter(a => a.status === "PRESENT").length,
    absent: attendance.filter(a => a.status === "ABSENT").length,
    late: attendance.filter(a => a.status === "LATE").length,
    total: attendance.length
  };

  const attendanceRate = stats.total > 0 ? Math.round(((stats.total - stats.absent) / stats.total) * 100) : 100;

  if (loading) return <div className="p-12 text-center text-slate-500">Chargement de votre historique...</div>;

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-indigo-50 border-l-4 border-l-indigo-600">
          <CardContent className="p-6">
            <p className="text-indigo-600 text-xs font-black uppercase tracking-widest">Taux de Présence</p>
            <h3 className="text-3xl font-black mt-2 text-indigo-900">{attendanceRate}%</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50 border-l-4 border-l-emerald-600">
          <CardContent className="p-6">
            <p className="text-emerald-600 text-xs font-black uppercase tracking-widest">Présent</p>
            <h3 className="text-3xl font-black mt-2 text-emerald-900">{stats.present}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50 border-l-4 border-l-red-600">
          <CardContent className="p-6">
            <p className="text-red-600 text-xs font-black uppercase tracking-widest">Absent</p>
            <h3 className="text-3xl font-black mt-2 text-red-900">{stats.absent}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50 border-l-4 border-l-amber-600">
          <CardContent className="p-6">
            <p className="text-amber-600 text-xs font-black uppercase tracking-widest">Retards</p>
            <h3 className="text-3xl font-black mt-2 text-amber-900">{stats.late}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Main Filter & Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-lg font-black font-heading text-slate-900 flex items-center">
             <BarChart3 className="w-5 h-5 mr-3 text-blue-600" /> Historique détaillé
          </h3>
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
                placeholder="Filtrer par matière..." 
                className="pl-10 h-10 bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
             />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Matière</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Date</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Professeur</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right pr-6">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendance.map((a, i) => (
              <TableRow key={i} className="hover:bg-slate-50/50 transition-colors group">
                <TableCell className="py-4">
                   <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                         <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900">{a.course?.subject?.name}</span>
                   </div>
                </TableCell>
                <TableCell className="py-4">
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{new Date(a.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long' })}</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase">{new Date(a.date).toLocaleDateString("fr-FR", { weekday: 'long' })}</span>
                   </div>
                </TableCell>
                <TableCell className="py-4">
                   <span className="text-sm text-slate-600 font-medium">M. {a.course?.teacher?.user?.name}</span>
                </TableCell>
                <TableCell className="py-4 text-right pr-6">
                   <Badge className={`
                      px-3 py-1 rounded-full text-[10px] font-black border-none uppercase tracking-tighter
                      ${a.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : ""}
                      ${a.status === "ABSENT" ? "bg-red-100 text-red-700" : ""}
                      ${a.status === "LATE" ? "bg-amber-100 text-amber-700" : ""}
                   `}>
                      {a.status === "PRESENT" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {a.status === "ABSENT" && <XCircle className="w-3 h-3 mr-1" />}
                      {a.status === "LATE" && <Clock className="w-3 h-3 mr-1" />}
                      {a.status === "PRESENT" ? "Présent" : a.status === "ABSENT" ? "Absent" : "Retard"}
                   </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredAttendance.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-400 italic">
                  Aucun enregistrement trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
