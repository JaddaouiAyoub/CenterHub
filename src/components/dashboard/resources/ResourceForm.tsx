"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { createSubjectResource, updateSubjectResource } from "@/actions/subjectResources";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ResourceForm({ 
  isOpen, 
  onClose, 
  resource, 
  subjects,
  classes,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  resource?: any;
  subjects: any[];
  classes: any[];
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      name: "",
      link: "",
      subjectId: "",
      classIds: [] as string[]
    }
  });

  const subjectId = watch("subjectId");
  const classIds = watch("classIds");

  useEffect(() => {
    if (resource) {
      reset({
        name: resource.name,
        link: resource.link,
        subjectId: resource.subjectId,
        classIds: resource.classes?.map((c: any) => c.id) || []
      });
    } else {
      reset({
        name: "",
        link: "",
        subjectId: "",
        classIds: []
      });
    }
  }, [resource, reset, isOpen]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("link", data.link);
    formData.append("subjectId", data.subjectId);
    
    // Append each classId to formData
    data.classIds.forEach((id: string) => {
      formData.append("classIds", id);
    });

    const res = await (resource 
      ? updateSubjectResource(resource.id, formData) 
      : createSubjectResource(formData));

    if (res.success) {
      toast.success(res.success);
      onSuccess();
      onClose();
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const classOptions = classes.map(c => ({
    id: c.id,
    name: c.name
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-none rounded-[2rem] shadow-2xl p-8 bg-white overflow-hidden">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
            {resource ? "Modifier la Séance" : "Nouvelle Séance"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium tracking-tight">
            Remplissez les détails pour ajouter ou modifier une ressource pédagogique par matière.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nom de la Séance</Label>
            <Input 
              id="name"
              {...register("name", { required: true })}
              placeholder="ex: Séance Review - Chapitre 1" 
              className="h-14 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 px-6 font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lien de la Séance (Meeting, Drive, YouTube...)</Label>
            <Input 
              id="link"
              {...register("link", { required: true })}
              placeholder="https://..." 
              className="h-14 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 px-6 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subjectId" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Matière</Label>
              <Select 
                value={subjectId} 
                onValueChange={(val) => setValue("subjectId", val || "")}
              >
                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 px-6 font-semibold text-left">
                  <SelectValue placeholder="Matière">
                    {subjectId ? subjects.find(s => s.id === subjectId)?.name : "Matière"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="rounded-xl p-3 font-semibold cursor-pointer">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Classes</Label>
              <MultiSelect
                options={classOptions}
                onChange={(vals: string[]) => setValue("classIds", vals)}
                selectedIds={classIds}
                placeholder="Sélectionner classes"
                className="bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 px-6 min-h-[3.5rem]"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (resource ? "Mettre à jour" : "Créer")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
