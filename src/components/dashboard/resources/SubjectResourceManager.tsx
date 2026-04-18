"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  ExternalLink,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSubjectResources, deleteSubjectResource } from "@/actions/subjectResources";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ResourceForm } from "./ResourceForm";

export function SubjectResourceManager({ 
  role, 
  subjects,
  classes,
  studentId
}: { 
  role: string; 
  subjects: any[];
  classes: any[];
  studentId?: string;
}) {
  const [resources, setResources] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const canEdit = role === "TEACHER" || role === "SECRETARY" || role === "ADMIN";
  const isStudent = role === "STUDENT";

  const fetchResources = async () => {
    setLoading(true);
    const res = await getSubjectResources({
      search,
      subjectId: selectedSubject,
      studentId: isStudent ? studentId : undefined,
      page,
      pageSize
    });

    if (res.resources) {
      setResources(res.resources);
      setTotal(res.total || 0);
    } else {
      toast.error(res.error || "Erreur de chargement");
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
  }, [search, selectedSubject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedSubject, page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette ressource ?")) return;
    
    const res = await deleteSubjectResource(id);
    if (res.success) {
      toast.success(res.success);
      fetchResources();
    } else {
      toast.error(res.error);
    }
  };

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Espace Ressources</h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Accédez aux séances et supports de cours par matière.
          </p>
        </div>
        {canEdit && (
          <Button 
            onClick={() => {
              setEditingResource(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" /> Nouvelle Séance
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
        <CardHeader className="border-b border-slate-50 p-8 pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Rechercher par nom de séance..." 
                className="pl-12 h-12 bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedSubject} onValueChange={(val) => setSelectedSubject(val || "all")}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Toutes les matières">
                      {selectedSubject === "all" ? "Toutes les matières" : subjects.find(s => s.id === selectedSubject)?.name || "Toutes les matières"}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="all">Toutes les matières</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[30%]">Nom de la Séance</TableHead>
                  <TableHead className="w-[20%] text-center">Matière</TableHead>
                  {!isStudent && <TableHead className="text-center w-[20%]">Ajouté le</TableHead>}
                  {isStudent && <TableHead className="text-center w-[20%]">Lien</TableHead>}
                  {!isStudent && <TableHead className="text-center w-[20%]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse bg-white border-b border-slate-50/50">
                      <TableCell colSpan={canEdit ? 4 : 3} className="h-16"></TableCell>
                    </TableRow>
                  ))
                ) : resources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 4 : 3} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <FileText className="w-12 h-12 mb-4" />
                        <p className="font-bold">Aucune ressource trouvée</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  resources.map((resource) => (
                    <TableRow key={resource.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span>{resource.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-normal text-slate-600 bg-slate-100/80 hover:bg-slate-100">
                          {resource.subject?.name}
                        </Badge>
                      </TableCell>
                      
                      {!isStudent && (
                        <TableCell className="text-center">
                          <span className="text-slate-500 text-sm">
                            {format(new Date(resource.createdAt), "d MMM yyyy", { locale: fr })}
                          </span>
                        </TableCell>
                      )}

                      {isStudent && (
                        <TableCell className="text-center">
                          <Button 
                            variant="default" 
                            size="sm"
                            className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700"
                            onClick={() => window.open(resource.link, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-2" /> Consulter
                          </Button>
                        </TableCell>
                      )}

                      {!isStudent && (
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-600"
                              onClick={() => window.open(resource.link, '_blank')}
                              title="Ouvrir le lien"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" />}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl p-2 min-w-[160px]">
                                <DropdownMenuItem 
                                  onClick={() => handleEdit(resource)}
                                  className="rounded-xl p-3 font-bold text-slate-600 cursor-pointer focus:bg-slate-50"
                                >
                                  <Pencil className="w-4 h-4 mr-3" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(resource.id)}
                                  className="rounded-xl p-3 font-bold text-red-600 cursor-pointer focus:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-3" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Affichage {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} sur {total} ressources
            </p>
            <div className="flex space-x-1">
              <Button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages || 1 }).map((_, i) => (
                <Button 
                  key={i} 
                  onClick={() => setPage(i + 1)}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  className={`h-8 w-8 p-0 ${page === i + 1 ? 'bg-blue-600 text-white' : ''}`}
                >
                  {i + 1}
                </Button>
              ))}
              <Button 
                disabled={page === totalPages || totalPages === 0} 
                onClick={() => setPage(page + 1)}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ResourceForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        resource={editingResource}
        subjects={subjects}
        classes={classes}
        onSuccess={fetchResources}
      />
    </div>
  );
}
