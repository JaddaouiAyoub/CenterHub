"use client";

import { useState, useEffect } from "react";
import { getPaginatedTeachers, createTeacher, updateTeacher, deleteTeacher } from "@/actions/teachers";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CsvExportButton } from "@/components/ui/csv-export-button";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function TeachersList() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Pagination & Search
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await getPaginatedTeachers(search, page, pageSize);
      if (res.teachers) {
        setTeachers(res.teachers);
        setTotalItems(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
      if (res.error) toast.error(res.error);
    } catch (error) {
       toast.error("Erreur de chargement des enseignants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, pageSize]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createTeacher(formData);
    if (res.success) {
      toast.success("Enseignant ajouté");
      setIsCreateOpen(false);
      fetchTeachers();
    } else {
      toast.error(res.error || "Échec de l'ajout");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!showPassword) formData.delete("password");
    
    const res = await updateTeacher(editingTeacher.id, formData);
    if (res.success) {
      toast.success("Enseignant mis à jour");
      setEditingTeacher(null);
      setShowPassword(false);
      fetchTeachers();
    } else {
      toast.error(res.error || "Échec de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cet enseignant ?")) {
      const res = await deleteTeacher(id);
      if (res.success) {
        toast.success("Enseignant supprimé");
        fetchTeachers();
      } else {
        toast.error(res.error || "Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Corps Enseignant</h2>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Input 
            placeholder="Rechercher un enseignant..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-64 border-slate-200"
          />
          <CsvExportButton
            data={teachers}
            filename="enseignants"
            columns={[
              { label: "Nom", value: (t) => t.name },
              { label: "Email", value: (t) => t.email },
              { label: "Spécialisation", value: (t) => t.teacherProfile?.specialization ?? "Non définie" },
            ]}
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 whitespace-nowrap")}>
              <UserPlus className="w-4 h-4 mr-2" /> Ajouter un Enseignant
            </DialogTrigger>

          <DialogContent className="sm:max-w-xl overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-white text-xl">Nouvel Enseignant</DialogTitle>
              <p className="text-blue-100 text-sm mt-1">Créez un accès pour un nouveau membre du centre.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 bg-white">
              <div className="space-y-2">
                <Label className="text-slate-600">Nom Complet</Label>
                <Input name="name" placeholder="Prénom Nom" required className="border-slate-200 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Email (Identifiant)</Label>
                <Input name="email" type="email" placeholder="example@center.com" required className="border-slate-200 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Mot de Passe</Label>
                <Input name="password" type="password" required className="border-slate-200 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Spécialisation</Label>
                <Input name="specialization" placeholder="Ex: Mathématiques" className="border-slate-200 focus:ring-blue-500" />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12">Créer le compte</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-white text-xl">Modifier Enseignant</DialogTitle>
            <p className="text-blue-100 text-sm mt-1">Mise à jour des informations de {editingTeacher?.name}.</p>
          </div>
          <form onSubmit={handleUpdate} className="p-6 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="text-slate-600">Nom Complet</Label>
              <Input key={`name-${editingTeacher?.id}`} name="name" defaultValue={editingTeacher?.name} required className="border-slate-200 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Email</Label>
              <Input key={`email-${editingTeacher?.id}`} name="email" type="email" defaultValue={editingTeacher?.email} required className="border-slate-200 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Spécialisation</Label>
              <Input key={`spec-${editingTeacher?.id}`} name="specialization" defaultValue={editingTeacher?.teacherProfile?.specialization} className="border-slate-200 focus:ring-blue-500" />
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <input 
                type="checkbox" 
                id="change-pw" 
                checked={showPassword} 
                onChange={() => setShowPassword(!showPassword)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <Label htmlFor="change-pw" className="text-sm text-slate-500 cursor-pointer">Modifier le mot de passe</Label>
            </div>

            {showPassword && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Label className="text-slate-600">Nouveau Mot de Passe</Label>
                <Input name="password" type="password" required className="border-slate-200 focus:ring-blue-500" />
              </div>
            )}

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">Enregistrer les modifications</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Nom</TableHead>
              <TableHead className="font-semibold text-slate-700">Email</TableHead>
              <TableHead className="font-semibold text-slate-700">Spécialisation</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">Chargement des enseignants...</TableCell></TableRow>
            ) : teachers.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">Aucun enseignant inscrit.</TableCell></TableRow>
            ) : (
              teachers.map((t) => (
                <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{t.name}</TableCell>
                  <TableCell className="text-slate-500">{t.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3 py-1 font-normal">
                      {t.teacherProfile?.specialization || "Non définie"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => setEditingTeacher(t)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(t.id)}
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

