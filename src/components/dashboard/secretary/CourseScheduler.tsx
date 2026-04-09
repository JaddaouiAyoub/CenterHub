"use client";

import { useState, useEffect } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse, getSubjects, getClasses, createSubject, createClass } from "@/actions/courses";
import { getTeachers } from "@/actions/teachers";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, Trash2, Plus, Clock, BookOpen, Users, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function CourseScheduler() {
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [co, su, cl, te] = await Promise.all([
        getCourses(), getSubjects(), getClasses(), getTeachers()
      ]);
      if (co.courses) setCourses(co.courses);
      if (co.error) toast.error(co.error);
      setSubjects(su || []);
      setClasses(cl || []);
      if (te.teachers) setTeachers(te.teachers);
    } catch (error) {
      toast.error("Erreur de chargement du calendrier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Emploi du Temps</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleCreateSubject} className="border-slate-200 text-slate-600 hover:bg-slate-50">
             <BookOpen className="w-4 h-4 mr-2" /> + Matière
          </Button>
          <Button variant="outline" onClick={handleCreateClass} className="border-slate-200 text-slate-600 hover:bg-slate-50">
             <Users className="w-4 h-4 mr-2" /> + Classe
          </Button>
          <Dialog open={isCourseOpen} onOpenChange={setIsCourseOpen}>
            <DialogTrigger render={
              <Button className="bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200">
                <Calendar className="w-4 h-4 mr-2" /> Planifier un cours
              </Button>
            } />

            <DialogContent className="sm:max-w-[500px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-white text-xl">Nouveau Cours</DialogTitle>
                <p className="text-purple-100 text-sm mt-1">Définissez un créneau dans le calendrier scolaire.</p>
              </div>
              <form onSubmit={handleCreateCourse} className="p-6 space-y-4 bg-white">
                <div className="space-y-2">
                  <Label className="text-slate-600">Nom du cours / Description</Label>
                  <Input name="name" placeholder="Ex: Soutien Mathématiques" required className="border-slate-200 focus:ring-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-600">Enseignant</Label>
                    <Select name="teacherId">
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Facultatif">
                          {(val: any) => val ? teachers.find(t => t.teacherProfile?.id?.toString() === val.toString())?.name || val : "Facultatif"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(t => (
                          <SelectItem key={t.teacherProfile?.id} value={t.teacherProfile?.id?.toString() || ""} label={t.name}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Matière</Label>
                    <Select name="subjectId">
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Obligatoire">
                          {(val: any) => val ? subjects.find(s => s.id?.toString() === val.toString())?.name || val : "Obligatoire"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.id} value={s.id?.toString()} label={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Classe / Groupe</Label>
                  <Select name="classId">
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Choisir la classe">
                        {(val: any) => val ? classes.find(c => c.id?.toString() === val.toString())?.name || val : "Choisir la classe"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id?.toString()} label={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-600">Jour</Label>
                    <Select name="day">
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Jour">
                          {(val: any) => val ? DAYS[(parseInt(val, 10) + 6) % 7] || val : "Jour"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d, i) => (
                          <SelectItem key={i} value={((i + 1) % 7).toString()} label={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Début</Label>
                    <Input name="startTime" type="time" required className="border-slate-200 focus:ring-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Fin</Label>
                    <Input name="endTime" type="time" required className="border-slate-200 focus:ring-purple-500" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-12">Enregistrer le cours</Button>
              </form>
            </DialogContent>
          </Dialog>
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
          <form onSubmit={handleUpdateCourse} className="p-6 space-y-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Enseignant</Label>
                <Select key={`teacher-${editingCourse?.id}`} name="teacherId" defaultValue={editingCourse?.teacherId?.toString() || ""}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Choisir">
                      {(val: any) => val ? teachers.find(t => t.teacherProfile?.id?.toString() === val.toString())?.name || val : "Choisir"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.teacherProfile?.id} value={t.teacherProfile?.id?.toString() || ""} label={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Matière</Label>
                <Select key={`subject-${editingCourse?.id}`} name="subjectId" defaultValue={editingCourse?.subjectId?.toString() || ""}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Choisir">
                      {(val: any) => val ? subjects.find(s => s.id?.toString() === val.toString())?.name || val : "Choisir"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id?.toString()} label={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Classe</Label>
              <Select key={`class-${editingCourse?.id}`} name="classId" defaultValue={editingCourse?.classId?.toString() || ""}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Choisir">
                    {(val: any) => val ? classes.find(c => c.id?.toString() === val.toString())?.name || val : "Choisir"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id?.toString()} label={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Jour</Label>
                <Select key={`day-${editingCourse?.id}`} name="day" defaultValue={editingCourse?.day?.toString() || ""}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Choisir">
                      {(val: any) => val ? DAYS[(parseInt(val, 10) + 6) % 7] || val : "Choisir"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={i} value={((i + 1) % 7).toString()} label={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Début</Label>
                <Input key={`start-${editingCourse?.id}`} name="startTime" type="time" defaultValue={editingCourse?.startTime || ""} required className="border-slate-200 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Fin</Label>
                <Input key={`end-${editingCourse?.id}`} name="endTime" type="time" defaultValue={editingCourse?.endTime || ""} required className="border-slate-200 focus:ring-indigo-500" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">Sauvegarder les modifications</Button>
          </form>
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
              courses.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-sm">{c.name}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2 py-0.5 text-[10px] font-semibold">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {c.subject.name}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-2">
                       <div className="flex items-center space-x-2">
                         <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                           {c.teacher?.user.name.charAt(0) || "?"}
                         </div>
                         <span className="text-sm text-slate-700 font-medium">{c.teacher?.user.name || "Professeur non assigné"}</span>
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
                          {DAYS[(c.day + 6) % 7]}
                        </span>
                        <div className="flex items-center text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-md w-max">
                          <Clock className="w-3.5 h-3.5 mr-1.5" /> {c.startTime} - {c.endTime}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

