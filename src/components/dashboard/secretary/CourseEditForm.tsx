"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type SelectOption = {
  id: string | number;
  name: string;
  teacherProfile?: {
    id?: string | number;
  };
};

type CourseRecord = {
  id: string;
  name: string;
  classId?: string | number | null;
  teacherId?: string | number | null;
  subjectId?: string | number | null;
  day?: number | null;
  recurrence?: "WEEKLY" | "ONCE";
  specificDate?: string | Date | null;
  startTime?: string;
  endTime?: string;
  meetingLink?: string | null;
  // Relations éventuellement renvoyées par getCourses (utilisées en fallback
  // si les scalaires classId/teacherId/subjectId ne sont pas sélectionnés côté serveur)
  class?: { id?: string | number; name?: string } | null;
  subject?: { id?: string | number; name?: string } | null;
  teacher?: {
    id?: string | number;
    user?: {
      name?: string;
    };
  } | null;
};

type CourseEditFormProps = {
  course: CourseRecord;
  subjects: SelectOption[];
  classes: SelectOption[];
  teachers: Array<SelectOption & { name: string }>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function CourseEditForm({ course, subjects, classes, teachers, onSubmit }: CourseEditFormProps) {
  const [recurrenceType, setRecurrenceType] = useState<"WEEKLY" | "ONCE">(course?.recurrence || "WEEKLY");

  // Fallback : si les scalaires classId / teacherId / subjectId ne sont pas
  // présents sur l'objet (ex: select Prisma incomplet côté serveur), on
  // récupère l'id depuis l'objet relation correspondant.
  const [classId, setClassId] = useState(
    course?.classId?.toString() || course?.class?.id?.toString() || ""
  );
  const [teacherId, setTeacherId] = useState(
    course?.teacherId?.toString() || course?.teacher?.id?.toString() || ""
  );
  const [subjectId, setSubjectId] = useState(
    course?.subjectId?.toString() || course?.subject?.id?.toString() || ""
  );
  const [day, setDay] = useState(course?.day?.toString() || "");
  const [specificDate, setSpecificDate] = useState(
    course?.specificDate ? new Date(course.specificDate).toISOString().split("T")[0] : ""
  );

  const handleSpecificDateChange = (value: string) => {
    setSpecificDate(value);
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      setDay(date.getDay().toString());
    } else {
      setDay("");
    }
  };

  // Radix affiche le label depuis le SelectItem correspondant UNIQUEMENT si le
  // menu a déjà été "monté" une fois. Avec une valeur pré-remplie (cas de
  // l'édition), ce n'est pas encore le cas au premier rendu, donc on calcule
  // nous-mêmes le label à afficher pour éviter d'afficher l'id brut.
  const classLabel = classes.find((c) => c.id?.toString() === classId)?.name;
  const teacherLabel =
    teacherId === ""
      ? "Non assigné"
      : teachers.find((t) => t.teacherProfile?.id?.toString() === teacherId)?.name;
  const subjectLabel = subjects.find((s) => s.id?.toString() === subjectId)?.name;
  const dayLabel = day !== "" ? DAYS[(parseInt(day, 10) + 6) % 7] : undefined;

  return (
    <form key={course.id} onSubmit={onSubmit} className="p-6 space-y-4 bg-white">
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
          <Input name="name" defaultValue={course?.name} required className="border-slate-200 focus:ring-purple-500" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-600">Classe</Label>
          <Select name="classId" value={classId} onValueChange={(value) => setClassId(value || "")}>
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Choisir la classe">{classLabel}</SelectValue>
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
              <SelectValue placeholder="Choisir l'enseignant">{teacherLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Non assigné</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.teacherProfile?.id} value={t.teacherProfile?.id?.toString() || ""}>
                  {t.name}
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
              <SelectValue placeholder="Choisir la matière">{subjectLabel}</SelectValue>
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
                <SelectValue placeholder="Choisir le jour">{dayLabel}</SelectValue>
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
              className="border-slate-200 bg-white focus:ring-indigo-500"
              value={specificDate}
              onChange={(e) => handleSpecificDateChange(e.target.value)}
            />
            <input type="hidden" name="day" value={day} />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-slate-600">Début</Label>
          <Input name="startTime" type="time" defaultValue={course?.startTime || ""} required className="border-slate-200 bg-white focus:ring-indigo-500" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-600">Fin</Label>
          <Input name="endTime" type="time" defaultValue={course?.endTime || ""} required className="border-slate-200 bg-white focus:ring-indigo-500" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-600">
          Lien de la séance (ex: Zoom, Meet) <span className="text-slate-400 text-xs">- Facultatif</span>
        </Label>
        <Input name="meetingLink" type="url" defaultValue={course?.meetingLink || ""} placeholder="https://..." className="border-slate-200 focus:ring-indigo-500 font-mono text-sm" />
      </div>

      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">
        <Edit className="w-4 h-4 mr-2" />
        Sauvegarder les modifications
      </Button>
    </form>
  );
}
