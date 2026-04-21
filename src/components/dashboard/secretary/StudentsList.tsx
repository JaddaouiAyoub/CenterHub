"use client";

import { useState, useEffect } from "react";
import { getStudents, registerStudent, updateStudent, deleteStudent } from "@/actions/students";
import { getClasses, getSubjects } from "@/actions/courses";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { MultiSelect } from "@/components/ui/multi-select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2, Edit, GraduationCap, Eye, EyeOff } from "lucide-react";
import { CsvExportButton } from "@/components/ui/csv-export-button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function StudentsList() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Pagination & Search
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load static data (classes & subjects) only once on mount
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [cData, subData] = await Promise.all([getClasses(), getSubjects()]);
        setClasses(cData || []);
        setSubjects(subData || []);
      } catch {
        toast.error("Erreur de chargement des classes/matières");
      }
    };
    fetchStaticData();
  }, []);

  const fetchData = async () => {
    try {
      const sRes = await getStudents(search, page, pageSize);
      if (sRes.students) {
        setStudents(sRes.students);
        setTotalItems(sRes.total || 0);
        setTotalPages(sRes.totalPages || 1);
      }
      if (sRes.error) toast.error(sRes.error);
    } catch (error) {
      toast.error("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, pageSize]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    selectedSubjects.forEach(id => formData.append("subjectIds", id));
    selectedClasses.forEach(id => formData.append("classIds", id));
    
    const res = await registerStudent(formData);
    if (res.success) {
      toast.success("Étudiant inscrit avec succès");
      setIsRegisterOpen(false);
      fetchData();
    } else {
      toast.error(res.error || "Échec de l'inscription");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!showPassword) formData.delete("password");
    selectedSubjects.forEach(id => formData.append("subjectIds", id));
    selectedClasses.forEach(id => formData.append("classIds", id));
    
    const res = await updateStudent(editingStudent.id, formData);
    if (res.success) {
      toast.success("Informations mises à jour");
      setEditingStudent(null);
      setShowPassword(false);
      fetchData();
    } else {
      toast.error(res.error || "Échec de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cet étudiant ?")) {
      const res = await deleteStudent(id);
      if (res.success) {
        toast.success("Étudiant supprimé");
        fetchData();
      } else {
        toast.error(res.error || "Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Gestion des Étudiants</h2>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Input 
            placeholder="Rechercher un étudiant..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-64 border-slate-200"
          />
          <CsvExportButton
            data={students}
            filename="etudiants"
            columns={[
              { label: "Nom", value: (s) => s.name },
              { label: "Email", value: (s) => s.email },
              { label: "Classes", value: (s) => s.studentProfile?.classes?.map((c: any) => c.name).join(" | ") ?? "" },
              { label: "Matières", value: (s) => s.studentProfile?.subjects?.map((sub: any) => sub.name).join(" | ") ?? "" },
              { label: "Mot de passe", value: (s) => s.studentProfile?.plainPassword || "" },
              { label: "Date d'inscription", value: (s) => new Date(s.createdAt).toLocaleDateString('fr-FR') },
            ]}
          />
          <Dialog open={isRegisterOpen} onOpenChange={(open) => {
            setIsRegisterOpen(open);
            if(open) {
              setSelectedSubjects([]);
              setSelectedClasses([]);
            }
          }}>
            <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 whitespace-nowrap")}>
              <UserPlus className="w-4 h-4 mr-2" /> Nouvelle Inscription
            </DialogTrigger>

          <DialogContent className="sm:max-w-2xl overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-white text-xl">Nouvel Étudiant</DialogTitle>
              <p className="text-emerald-100 text-sm mt-1">Inscription d'un nouvel élève au centre.</p>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Nom Complet</Label>
                  <Input name="name" placeholder="Prénom Nom" required className="border-slate-200 focus:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Email (Connexion)</Label>
                  <Input name="email" type="email" placeholder="student@example.com" required className="border-slate-200 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Mot de Passe</Label>
                  <Input name="password" type="password" required className="border-slate-200 focus:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Date de Naissance</Label>
                  <Input name="dateOfBirth" type="date" className="border-slate-200 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Classes</Label>
                  <MultiSelect 
                    options={classes.map(c => ({ id: c.id, name: c.name }))}
                    selectedIds={selectedClasses}
                    onChange={setSelectedClasses}
                    placeholder="Sélectionner les classes"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Matières</Label>
                  <MultiSelect 
                    options={subjects.map(s => ({ id: s.id, name: s.name }))}
                    selectedIds={selectedSubjects}
                    onChange={setSelectedSubjects}
                    placeholder="Sélectionner les matières"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12">Inscrire l'étudiant</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => {
        if(!open) setEditingStudent(null);
      }}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-white text-xl">Modifier Étudiant</DialogTitle>
            <p className="text-emerald-100 text-sm mt-1">Mise à jour des informations de {editingStudent?.name}.</p>
          </div>
          <form onSubmit={handleUpdate} className="p-6 space-y-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Nom Complet</Label>
                <Input key={`name-${editingStudent?.id}`} name="name" defaultValue={editingStudent?.name} required className="border-slate-200 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Email</Label>
                <Input key={`email-${editingStudent?.id}`} name="email" type="email" defaultValue={editingStudent?.email} required className="border-slate-200 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Naissance</Label>
                <Input 
                  key={`dob-${editingStudent?.id}`}
                  name="dateOfBirth" 
                  type="date" 
                  defaultValue={editingStudent?.studentProfile?.dateOfBirth ? new Date(editingStudent.studentProfile.dateOfBirth).toISOString().split('T')[0] : ""} 
                  className="border-slate-200 focus:ring-emerald-500" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Classes</Label>
                <MultiSelect 
                  key={`classes-${editingStudent?.id}`}
                  options={classes.map(c => ({ id: c.id, name: c.name }))}
                  selectedIds={selectedClasses}
                  onChange={setSelectedClasses}
                  placeholder="Sélectionner les classes"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">Matières</Label>
              <MultiSelect 
                key={`subjects-${editingStudent?.id}`}
                options={subjects.map(s => ({ id: s.id, name: s.name }))}
                selectedIds={selectedSubjects}
                onChange={setSelectedSubjects}
                placeholder="Sélectionner les matières"
              />
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input 
                type="checkbox" 
                id="change-pw-s" 
                checked={showPassword} 
                onChange={() => setShowPassword(!showPassword)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <Label htmlFor="change-pw-s" className="text-sm text-slate-500 cursor-pointer">Modifier le mot de passe</Label>
            </div>

            {showPassword && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Label className="text-slate-600">Nouveau Mot de Passe</Label>
                <Input name="password" type="password" required className="border-slate-200 focus:ring-emerald-500" />
              </div>
            )}

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-12">Enregistrer les modifications</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Étudiant</TableHead>
              <TableHead className="font-semibold text-slate-700">Classe</TableHead>
              <TableHead className="font-semibold text-slate-700">Mot de Passe</TableHead>
              <TableHead className="font-semibold text-slate-700">Date d'inscription</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">Chargement des étudiants...</TableCell></TableRow>
            ) : students.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">Aucun étudiant inscrit.</TableCell></TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {s.studentProfile?.classes && s.studentProfile.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.studentProfile.classes.map((cl: any) => (
                            <Badge key={cl.id} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-2 py-0 font-medium">
                              {cl.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Non assigné</span>
                      )}
                      {s.studentProfile?.subjects && s.studentProfile.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.studentProfile.subjects.map((sub: any) => (
                            <Badge key={sub.id} variant="secondary" className="text-[10px] px-1 py-0 font-normal">
                              {sub.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                       <span className="text-sm font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                         {visiblePasswords[s.id] ? (s.studentProfile?.plainPassword || "---") : "••••••••"}
                       </span>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                         onClick={() => setVisiblePasswords(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                       >
                         {visiblePasswords[s.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      onClick={() => {
                        setEditingStudent(s);
                        setSelectedSubjects(s.studentProfile?.subjects?.map((sub:any) => sub.id) || []);
                        setSelectedClasses(s.studentProfile?.classes?.map((cl:any) => cl.id) || []);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(s.id)}
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

