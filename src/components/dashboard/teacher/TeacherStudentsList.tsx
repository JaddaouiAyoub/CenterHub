"use client";

import { useState, useEffect } from "react";
import { getTeacherStudents, getTeacherClasses } from "@/actions/students";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { CsvExportButton } from "@/components/ui/csv-export-button";
import { Search, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export function TeacherStudentsList({ teacherProfileId }: { teacherProfileId: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchClasses = async () => {
      const data = await getTeacherClasses(teacherProfileId);
      setClasses(data);
    };
    if (teacherProfileId) fetchClasses();
  }, [teacherProfileId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getTeacherStudents(teacherProfileId, search, page, pageSize, filterClassId);
      if (res.students) {
        setStudents(res.students);
        setTotalItems(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        toast.error(res.error || "Erreur de chargement");
      }
    } catch (error) {
      toast.error("Échec de la récupération des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterClassId, page, pageSize, teacherProfileId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-900">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Mes Étudiants</h2>
            <p className="text-sm text-slate-500">Liste des élèves inscrits dans vos classes.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Rechercher par nom..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 border-slate-200 focus:ring-indigo-500 w-full"
            />
          </div>
          <Select 
            value={filterClassId} 
            onValueChange={(val) => { setFilterClassId(val || "all"); setPage(1); }}
          >
            <SelectTrigger className="w-full sm:w-40 border-slate-200">
              <SelectValue placeholder="Toutes les classes">
                {filterClassId === "all" ? "Toutes les classes" : classes.find(c => c.id === filterClassId)?.name || "Toutes les classes"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CsvExportButton
            data={students}
            filename="mes_etudiants"
            columns={[
              { label: "Nom", value: (s) => s.name },
              { label: "Email", value: (s) => s.email },
              { label: "Classes", value: (s) => s.studentProfile?.classes?.map((c: any) => c.name).join(" | ") ?? "" },
              { label: "Matières", value: (s) => s.studentProfile?.subjects?.map((sub: any) => sub.name).join(" | ") ?? "" },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700 py-4 pl-6">Nom</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4">Email</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4">Classes</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4">Matières suivies</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Chargement des étudiants...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center space-y-1">
                    <Users className="w-8 h-8 text-slate-200 mb-2" />
                    <p>Aucun étudiant trouvé.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 pl-6 font-medium text-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <span>{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{s.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.studentProfile?.classes?.map((c: any) => (
                        <Badge key={c.id} variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-normal border-none">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.studentProfile?.subjects?.map((sub: any) => (
                        <Badge key={sub.id} className="bg-blue-50 text-blue-700 text-[10px] font-normal border-none">
                          {sub.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
