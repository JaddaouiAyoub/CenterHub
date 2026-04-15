"use client";

import { useState, useEffect } from "react";
import { 
  getTeacherEvaluations, 
  createEvaluation, 
  updateEvaluation, 
  deleteEvaluation, 
  getTeacherSubjectsClasses, 
  getStudentsForGrades, 
  upsertGrades 
} from "@/actions/grades";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  FileText, 
  Save, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Clock,
  ArrowLeft,
  Calendar as CalendarIcon,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EvaluationType } from "@prisma/client";
import { useTranslations } from "next-intl";

export function TeacherGrades({ teacherProfileId }: { teacherProfileId: string }) {
  const t = useTranslations("grades");
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [gradeValues, setGradeValues] = useState<Record<string, { value: string, comment: string }>>({});
  const [savingGrades, setSavingGrades] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [pairs, setPairs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    type: "CONTROLE_1" as EvaluationType,
    pairIndex: "",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEvaluations();
    fetchPairs();
  }, [teacherProfileId]);

  const fetchEvaluations = async () => {
    const res = await getTeacherEvaluations(teacherProfileId);
    if (res.evaluations) setEvaluations(res.evaluations);
    setLoading(false);
  };

  const fetchPairs = async () => {
    const res = await getTeacherSubjectsClasses(teacherProfileId);
    if (res.pairs) setPairs(res.pairs);
  };

  const handleCreateEvaluation = async () => {
    if (!formData.title || formData.pairIndex === "") {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const pair = pairs[parseInt(formData.pairIndex)];
    const res = await createEvaluation({
      title: formData.title,
      type: formData.type,
      subjectId: pair.subjectId,
      classId: pair.classId,
      teacherId: teacherProfileId,
      date: new Date(formData.date)
    });

    if (res.success) {
      toast.success("Évaluation créée avec succès");
      setIsDialogOpen(false);
      fetchEvaluations();
      setFormData({
        title: "",
        type: "CONTROLE_1",
        pairIndex: "",
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      toast.error(res.error || "Erreur lors de la création");
    }
  };

  const handleSelectEvaluation = async (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    const res = await getStudentsForGrades(evaluation.id);
    if (res.students) {
      setStudents(res.students);
      const initialGrades: Record<string, { value: string, comment: string }> = {};
      res.students.forEach((s: any) => {
        const existingGrade = s.grades[0];
        initialGrades[s.id] = {
          value: existingGrade ? existingGrade.value.toString() : "",
          comment: existingGrade ? existingGrade.comment || "" : ""
        };
      });
      setGradeValues(initialGrades);
    }
  };

  const handleSaveGrades = async (published: boolean = false) => {
    setSavingGrades(true);
    const gradesArray = Object.entries(gradeValues)
      .filter(([_, data]) => data.value !== "")
      .map(([studentId, data]) => ({
        studentId,
        value: parseFloat(data.value),
        comment: data.comment
      }));

    if (gradesArray.length === 0 && !published) {
      toast.error("Aucune note à enregistrer");
      setSavingGrades(false);
      return;
    }

    const res = await upsertGrades(selectedEvaluation.id, gradesArray);
    
    if (res.success) {
      if (published) {
        const pubRes = await updateEvaluation(selectedEvaluation.id, { isPublished: true });
        if (pubRes.success) {
          toast.success("Notes publiées !");
          setSelectedEvaluation({ ...selectedEvaluation, isPublished: true });
        }
      } else {
        toast.success("Brouillon enregistré");
      }
      fetchEvaluations();
    } else {
      toast.error("Erreur lors de l'enregistrement");
    }
    setSavingGrades(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Êtes-vous sûr de vouloir supprimer cette évaluation ?")) {
      const res = await deleteEvaluation(id);
      if (res.success) {
        toast.success("Évaluation supprimée");
        fetchEvaluations();
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (selectedEvaluation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedEvaluation(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{selectedEvaluation.title}</h2>
            <p className="text-slate-500">{selectedEvaluation.subject.name} • {selectedEvaluation.class.name}</p>
          </div>
          <div className="ml-auto flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleSaveGrades(false)}
              disabled={savingGrades || selectedEvaluation.isPublished}
            >
              <Save className="w-4 h-4 mr-2" /> Enregistrer brouillon
            </Button>
            {!selectedEvaluation.isPublished && (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleSaveGrades(true)}
                disabled={savingGrades}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Publier les notes
              </Button>
            )}
            {selectedEvaluation.isPublished && (
              <Badge className="bg-emerald-100 text-emerald-700 border-none h-10 px-4">
                Publié
              </Badge>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[300px]">Étudiant</TableHead>
                <TableHead className="w-[150px]">Note / 20</TableHead>
                <TableHead>Commentaire</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {student.user.name.charAt(0)}
                      </div>
                      <span>{student.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min="0" 
                      max="20" 
                      step="0.25"
                      value={gradeValues[student.id]?.value || ""}
                      onChange={(e) => setGradeValues({
                        ...gradeValues,
                        [student.id]: { ...gradeValues[student.id], value: e.target.value }
                      })}
                      className="w-24 text-center font-bold"
                      placeholder="--"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      placeholder="Observation..."
                      value={gradeValues[student.id]?.comment || ""}
                      onChange={(e) => setGradeValues({
                        ...gradeValues,
                        [student.id]: { ...gradeValues[student.id], comment: e.target.value }
                      })}
                      className="w-full"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500">Gérez les évaluations et les résultats de vos classes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
              <Plus className="w-4 h-4 mr-2" /> Nouvelle évaluation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Créer une évaluation</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'évaluation</Label>
                <Input 
                  id="title" 
                  placeholder="ex: Contrôle continu 1" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val: EvaluationType) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTROLE_1">Contrôle 1</SelectItem>
                      <SelectItem value="CONTROLE_2">Contrôle 2</SelectItem>
                      <SelectItem value="CONTROLE_3">Contrôle 3</SelectItem>
                      <SelectItem value="DEVOIR">Devoir</SelectItem>
                      <SelectItem value="EXAMEN">Examen</SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Matière & Classe</Label>
                <Select 
                  value={formData.pairIndex} 
                  onValueChange={(val) => setFormData({ ...formData, pairIndex: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le groupe">
                      {formData.pairIndex !== "" && pairs[parseInt(formData.pairIndex)] 
                        ? `${pairs[parseInt(formData.pairIndex)].subjectName} - ${pairs[parseInt(formData.pairIndex)].className}` 
                        : "Sélectionner le groupe"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {pairs.map((p, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {p.subjectName} - {p.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateEvaluation} className="bg-blue-600 hover:bg-blue-700 text-white">
                Créer l'évaluation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evaluations.map((ev) => (
          <div 
            key={ev.id} 
            onClick={() => handleSelectEvaluation(ev)}
            className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${ev.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <Badge className={`border-none ${ev.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {ev.isPublished ? "Publié" : "Brouillon"}
              </Badge>
            </div>
            
            <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{ev.title}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-slate-500">
                <BookOpen className="w-4 h-4 mr-2" /> {ev.subject.name}
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <GraduationCap className="w-4 h-4 mr-2" /> {ev.class.name}
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <CalendarIcon className="w-4 h-4 mr-2" /> {new Date(ev.date).toLocaleDateString('fr-FR')}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="text-xs font-medium text-slate-400">
                {ev._count.grades} notes saisies
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => handleDelete(ev.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 group-hover:text-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {evaluations.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucune évaluation</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Commencez par créer votre première évaluation pour cette classe.</p>
          </div>
        )}
      </div>
    </div>
  );
}
