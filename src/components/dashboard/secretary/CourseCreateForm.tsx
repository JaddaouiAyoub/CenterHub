"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type SelectOption = {
  id: string | number;
  name: string | null;
  teacherProfile?: {
    id?: string | number;
  } | null;
};

type CourseCreateFormProps = {
  subjects: SelectOption[];
  classes: SelectOption[];
  // name peut être null : User.name est String? dans le schema Prisma
  teachers: SelectOption[];
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function CourseCreateForm({ subjects, classes, teachers, onSubmit }: CourseCreateFormProps) {
  const [recurrenceType, setRecurrenceType] = useState<"WEEKLY" | "ONCE">("WEEKLY");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [day, setDay] = useState("");
  const [specificDate, setSpecificDate] = useState("");

  const handleSpecificDateChange = (value: string) => {
    setSpecificDate(value);
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      setDay(date.getDay().toString());
    } else {
      setDay("");
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-4 bg-white">
      <div className="space-y-2">
        <Label className="text-slate-600 font-bold">Type de Séance</Label>
        <Select name="recurrence" value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as "WEEKLY" | "ONCE")}>
          <SelectTrigger className="border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEEKLY">Hebdomadaire (Récurrente)</SelectItem>
            <SelectItem value="ONCE">Séance Unique (Date précise)</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="recurrence" value={recurrenceType} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-600">Nom du cours / Description</Label>
          <Input name="name" placeholder="Ex: Soutien Mathématiques" required className="border-slate-200 focus:ring-purple-500" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-600">Classe / Groupe</Label>
          <Select name="classId" value={classId} onValueChange={(value) => setClassId(value || "")}>
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Choisir la classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id?.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="classId" value={classId} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-600">Enseignant</Label>
          <Select name="teacherId" value={teacherId} onValueChange={(value) => setTeacherId(value || "")}>
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Facultatif" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun enseignant</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.teacherProfile?.id} value={t.teacherProfile?.id?.toString() || ""}>
                  {t.name || "Enseignant sans nom"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="teacherId" value={teacherId} />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-600">Matière</Label>
          <Select name="subjectId" value={subjectId} onValueChange={(value) => setSubjectId(value || "")}>
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Obligatoire" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id?.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="subjectId" value={subjectId} />
        </div>
      </div>

      <div className={`grid ${recurrenceType === "ONCE" ? "grid-cols-1" : "grid-cols-3"} gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100`}>
        {recurrenceType === "WEEKLY" ? (
          <div className="space-y-2">
            <Label className="text-slate-600">Jour</Label>
            <Select name="day" value={day} onValueChange={(value) => setDay(value || "")}>
              <SelectTrigger className="border-slate-200 bg-white">
                <SelectValue placeholder="Jour" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={((i + 1) % 7).toString()}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="day" value={day} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-slate-600">Date Précise</Label>
            <Input
              name="specificDate"
              type="date"
              required
              className="border-slate-200 bg-white focus:ring-purple-500"
              value={specificDate}
              onChange={(e) => handleSpecificDateChange(e.target.value)}
            />
            <input type="hidden" name="day" value={day} />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-slate-600">Début</Label>
          <Input name="startTime" type="time" required className="border-slate-200 bg-white focus:ring-purple-500" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-600">Fin</Label>
          <Input name="endTime" type="time" required className="border-slate-200 bg-white focus:ring-purple-500" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-600">
          Lien de la séance (ex: Zoom, Meet) <span className="text-slate-400 text-xs">- Facultatif</span>
        </Label>
        <Input name="meetingLink" type="url" placeholder="https://..." className="border-slate-200 focus:ring-purple-500 font-mono text-sm" />
      </div>

      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-12">
        <Calendar className="w-4 h-4 mr-2" />
        Enregistrer le cours
      </Button>
    </form>
  );
}
