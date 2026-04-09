"use client";

import { useState, useEffect } from "react";
import { getPaginatedClasses, createClass, updateClass, deleteClass } from "@/actions/courses";
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
import { School, Plus, Trash2, Edit } from "lucide-react";

export function ClassesList() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);

  // Pagination & Search
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClasses = async () => {
    setLoading(true);
    const res = await getPaginatedClasses(search, page, pageSize);
    if (res.classes) {
      setClasses(res.classes);
      setTotalItems(res.total || 0);
      setTotalPages(res.totalPages || 1);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, pageSize]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const res = await createClass(name);
    if (res.classData) {
      setIsCreateOpen(false);
      fetchClasses();
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const res = await updateClass(editingClass.id, name);
    if (res.classData) {
      setEditingClass(null);
      fetchClasses();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette classe ?")) {
      await deleteClass(id);
      fetchClasses();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Organisation des Classes</h2>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Input 
            placeholder="Rechercher une classe..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-64 border-slate-200"
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" /> Nouvelle Classe
              </Button>
            } />
          <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <School className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-white text-xl">Ajouter une Classe</DialogTitle>
              <p className="text-emerald-100 text-sm mt-1">Créez un nouveau groupe d'élèves pour le centre.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 bg-white">
              <div className="space-y-2">
                <Label className="text-slate-600">Nom de la classe</Label>
                <Input name="name" placeholder="Ex: Groupe A, 2ème Année, etc." required className="border-slate-200 focus:ring-emerald-500" />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12">Créer la classe</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-white text-xl">Modifier la Classe</DialogTitle>
            <p className="text-emerald-100 text-sm mt-1">Renommer le groupe sélectionné.</p>
          </div>
          <form onSubmit={handleUpdate} className="p-6 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="text-slate-600">Nouveau nom</Label>
              <Input name="name" defaultValue={editingClass?.name} required className="border-slate-200 focus:ring-emerald-500" />
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-12">Enregistrer les changements</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Nom de la Classe</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-400 italic">Chargement...</TableCell></TableRow>
            ) : classes.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">Aucune classe définie.</TableCell></TableRow>
            ) : (
              classes.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <School className="w-4 h-4" />
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      onClick={() => setEditingClass(c)}
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

