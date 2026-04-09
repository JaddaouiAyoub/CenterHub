"use client";

import { useState, useEffect } from "react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/actions/courses";
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
import { BookOpen, Edit, Plus, Trash2 } from "lucide-react";

export function SubjectsList() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  const fetchSubjects = async () => {
    const data = await getSubjects();
    setSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const res = await createSubject(name);
    if (res.subject) {
      setIsCreateOpen(false);
      fetchSubjects();
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const res = await updateSubject(editingSubject.id, name);
    if (res.subject) {
      setEditingSubject(null);
      fetchSubjects();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette matière ?")) {
      await deleteSubject(id);
      fetchSubjects();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Catalogue des Matières</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200">
              <Plus className="w-4 h-4 mr-2" /> Nouvelle Matière
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-white text-xl">Ajouter une Matière</DialogTitle>
              <p className="text-blue-100 text-sm mt-1">Définissez une nouvelle discipline d'enseignement.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 bg-white">
              <div className="space-y-2">
                <Label className="text-slate-600">Nom de la matière</Label>
                <Input name="name" placeholder="Ex: Mathématiques, Arabe, etc." required className="border-slate-200 focus:ring-blue-500" />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12">Créer la matière</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-white text-xl">Modifier la Matière</DialogTitle>
            <p className="text-blue-100 text-sm mt-1">Renommer la discipline sélectionnée.</p>
          </div>
          <form onSubmit={handleUpdate} className="p-6 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="text-slate-600">Nouveau nom</Label>
              <Input name="name" defaultValue={editingSubject?.name} required className="border-slate-200 focus:ring-blue-500" />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">Enregistrer les changements</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Nom de la Matière</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-400 italic">Chargement...</TableCell></TableRow>
            ) : subjects.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">Aucune matière enregistrée.</TableCell></TableRow>
            ) : (
              subjects.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span>{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => setEditingSubject(s)}
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
    </div>
  );
}

