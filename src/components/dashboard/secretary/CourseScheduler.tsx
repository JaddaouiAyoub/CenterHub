"use client";

import { useCallback, useEffect, useState } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse, getSubjects, getClasses, createSubject, createClass } from "@/actions/courses";
import { getTeachers } from "@/actions/teachers";
import { PaginationControls } from "@/components/ui/pagination-controls";
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
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Trash2, Clock, BookOpen, Users, Edit, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CourseCreateForm } from "./CourseCreateForm";
import { CourseEditForm } from "./CourseEditForm";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type CourseRecord = {
  id: string;
  name: string;
  classId?: string | number | null | undefined;
  teacherId?: string | number | null | undefined;
  subjectId?: string | number | null | undefined;
  day?: number | null;
  recurrence?: "WEEKLY" | "ONCE";
  specificDate?: string | Date | null;
  startTime?: string;
  endTime?: string;
  meetingLink?: string | null;
  subject: { id: string | number; name: string };
  class: { id: string | number; name: string };
  teacher?: {
    id?: string | number;
    user?: {
      name?: string;
    };
  } | null;
};

export function CourseScheduler() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string | number; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string | number; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ name: string; teacherProfile?: { id?: string | number } }>>([]);
  const [loading, setLoading] = useState(true);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null);

  // Pagination & Search
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      const [co, su, cl, te] = await Promise.all([
        getCourses(search, page, pageSize), getSubjects(), getClasses(), getTeachers()
      ]);
      if (co.courses) {
        setCourses(co.courses);
        setTotalItems(co.total || 0);
        setTotalPages(co.totalPages || 1);
      }
      if (co.error) toast.error(co.error);
      setSubjects(su || []);
      setClasses(cl || []);
      if (te.teachers) setTeachers(te.teachers);
    } catch {
      toast.error("Erreur de chargement du calendrier");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleCreateCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    toast.promise(createCourse(formData), {
      loading: "Planification en cours...",
      success: (res) => {
        if (!res.success) throw new Error(res.error || "Échec de la planification");
        setIsCourseOpen(false);
        fetchData();
        return "Cours planifié avec succès";
      },
      error: (err) => err.message || "Erreur inattendue"
    });
  };

  const handleUpdateCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Garde : editingCourse peut être null (le formulaire ne devrait pas être
    // soumis dans ce cas, mais TypeScript exige la vérification explicite).
    if (!editingCourse) return;
    const formData = new FormData(e.currentTarget);
    toast.promise(updateCourse(editingCourse.id, formData), {
      loading: "Mise à jour en cours...",
      success: (res) => {
        if (!res.success) throw new Error(res.error || "Échec de la mise à jour");
        setEditingCourse(null);
        fetchData();
        return "Cours mis à jour avec succès";
      },
      error: (err) => err.message || "Erreur inattendue"
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer ce créneau de cours ?")) {
      toast.promise(deleteCourse(id), {
        loading: "Suppression...",
        success: (res) => {
          if (!res.success) throw new Error(res.error || "Erreur lors de la suppression");
          fetchData();
          return "Cours supprimé";
        },
        error: (err) => err.message || "Erreur inattendue"
      });
    }
  };

  const handleCreateSubject = async () => {
    const name = prompt("Nom de la matière ?");
    if (name) {
      toast.promise(createSubject(name), {
        loading: "Ajout de la matière...",
        success: () => {
          fetchData();
          return "Matière ajoutée";
        },
        error: "Erreur lors de l'ajout"
      });
    }
  };

  const handleCreateClass = async () => {
    const name = prompt("Nom de la classe ?");
    if (name) {
      toast.promise(createClass(name), {
        loading: "Ajout de la classe...",
        success: () => {
          fetchData();
          return "Classe ajoutée";
        },
        error: "Erreur lors de l'ajout"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Emploi du Temps</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Input 
            placeholder="Rechercher un cours..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-56 border-slate-200"
          />
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleCreateSubject} className="border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none">
               <BookOpen className="w-4 h-4 mr-2" /> Matière
            </Button>
            <Button variant="outline" onClick={handleCreateClass} className="border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none">
               <Users className="w-4 h-4 mr-2" /> Classe
            </Button>
          <Dialog open={isCourseOpen} onOpenChange={setIsCourseOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200")}>
              <Calendar className="w-4 h-4 mr-2" /> Planifier un cours
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-white text-xl">Nouveau Cours</DialogTitle>
                <p className="text-purple-100 text-sm mt-1">Définissez un créneau dans le calendrier scolaire.</p>
              </div>
              <CourseCreateForm subjects={subjects} classes={classes} teachers={teachers} onSubmit={handleCreateCourse} />
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
        <DialogContent className="sm:max-w-[500px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-white text-xl">Modifier le Cours</DialogTitle>
            <p className="text-indigo-100 text-sm mt-1">Mise à jour du créneau pour {editingCourse?.name}.</p>
          </div>
          {editingCourse ? (
            <CourseEditForm
              course={editingCourse}
              subjects={subjects}
              classes={classes}
              teachers={teachers}
              onSubmit={handleUpdateCourse}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700 w-1/3">Détails du Cours</TableHead>
              <TableHead className="font-semibold text-slate-700 w-1/4">Intervenant & Classe</TableHead>
              <TableHead className="font-semibold text-slate-700 w-1/4">Horaire</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48">
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm font-medium">Chargement des cours...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Calendar className="w-10 h-10 text-slate-200 mb-2" />
                    <p>Aucun cours planifié.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              courses.map((c) => {
                // c.day peut être null/undefined en base (ex: séance ONCE mal
                // renseignée) : on sécurise avant l'opération arithmétique.
                const dayIndex = c.day != null ? (c.day + 6) % 7 : null;
                // c.specificDate peut être null/undefined : Date() n'accepte pas null.
                const specificDateLabel = c.specificDate
                  ? new Date(c.specificDate).toLocaleDateString("fr-FR")
                  : "Date non définie";
                const teacherInitial = c.teacher?.user?.name?.charAt(0) || "?";
                const teacherName = c.teacher?.user?.name || "Professeur non assigné";

                return (
                  <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">{c.name}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2 py-0.5 text-[10px] font-semibold">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {c.subject.name}
                          </Badge>
                          {c.meetingLink && (
                            <a href={c.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 hover:bg-emerald-100 transition-colors">
                              <Link className="w-3 h-3 mr-1" />
                              Lien
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2">
                         <div className="flex items-center space-x-2">
                           <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {teacherInitial}
                           </div>
                           <span className="text-sm text-slate-700 font-medium">{teacherName}</span>
                         </div>
                         <div className="flex items-center">
                            <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                              {c.class.name}
                            </Badge>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col space-y-1">
                          <span className="font-semibold text-slate-800 text-sm">
                            {c.recurrence === "WEEKLY"
                              ? (dayIndex != null ? DAYS[dayIndex] : "Jour non défini")
                              : specificDateLabel}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-md w-max">
                              <Clock className="w-3.5 h-3.5 mr-1.5" /> {c.startTime} - {c.endTime}
                            </div>
                            {c.recurrence === "ONCE" && (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] h-5">UNIQUE</Badge>
                            )}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => setEditingCourse(c)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
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
