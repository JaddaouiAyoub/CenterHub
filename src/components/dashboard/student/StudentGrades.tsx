"use client";

import { useState, useEffect } from "react";
import { getStudentGrades } from "@/actions/grades";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText, 
  GraduationCap, 
  Calendar as CalendarIcon,
  User,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function StudentGrades({ studentProfileId }: { studentProfileId: string }) {
  const t = useTranslations("grades");
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      const res = await getStudentGrades(studentProfileId);
      if (res.grades) setGrades(res.grades);
      setLoading(false);
    };
    fetchGrades();
  }, [studentProfileId]);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc: Record<string, any[]>, grade) => {
    const subjectName = grade.evaluation.subject.name;
    if (!acc[subjectName]) acc[subjectName] = [];
    acc[subjectName].push(grade);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("studentTitle")}</h1>
        <p className="text-slate-500">Consultez vos résultats académiques publiés.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => (
          <Card key={subjectName} className="border-none shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex items-center text-lg font-bold text-slate-800">
                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                {subjectName}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-semibold text-slate-600">Évaluation</TableHead>
                    <TableHead className="font-semibold text-slate-600">Date</TableHead>
                    <TableHead className="font-semibold text-slate-600">Professeur</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">Note</TableHead>
                    <TableHead className="font-semibold text-slate-600">Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectGrades.map((grade) => (
                    <TableRow key={grade.id} className="border-slate-50 hover:bg-blue-50/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{grade.evaluation.title}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {t(`types.${grade.evaluation.type}`)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        <div className="flex items-center">
                          <CalendarIcon className="w-3 h-3 mr-1.5" />
                          {new Date(grade.evaluation.date).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1.5" />
                          {grade.evaluation.teacher.user.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`
                          px-3 py-1 text-sm font-bold border-none rounded-lg
                          ${grade.value >= 16 ? "bg-emerald-100 text-emerald-700" : 
                            grade.value >= 10 ? "bg-blue-100 text-blue-700" : 
                            "bg-red-100 text-red-700"}
                        `}>
                          {grade.value} / 20
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-slate-500 italic text-sm truncate" title={grade.comment}>
                          {grade.comment || "--"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {grades.length === 0 && (
          <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{t("noGrades")}</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Revenez plus tard une fois que vos professeurs auront publié vos résultats.</p>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          <strong>Note :</strong> Seules les évaluations publiées sont visibles. Si vous ne voyez pas un contrôle récent, il est probablement encore en cours de traitement par votre professeur.
        </p>
      </div>
    </div>
  );
}
