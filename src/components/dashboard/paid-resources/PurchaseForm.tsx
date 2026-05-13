"use client";

import { useState, useEffect } from "react";
import { getAllResourcesForSelect, createPurchase } from "@/actions/paidResources";
import { getSubjects } from "@/actions/courses";
import { StudentSearchSelect } from "./StudentSearchSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PurchaseFormProps {
  onSuccess: () => void;
}

export function PurchaseForm({ onSuccess }: PurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    const subId = selectedSubjectId === "all" ? undefined : selectedSubjectId;
    getAllResourcesForSelect(subId).then((res) => {
      if (res.resources) {
        setResources(res.resources);
      }
    });
  }, [selectedSubjectId]);

  useEffect(() => {
    const resource = resources.find((r) => r.id === selectedResourceId);
    if (resource) {
      setAmountPaid(resource.price.toString());
    }
  }, [selectedResourceId, resources]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId || !selectedResourceId || !amountPaid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("resourceId", selectedResourceId);
      formData.append("amountPaid", amountPaid);
      formData.append("method", (e.currentTarget.elements.namedItem("method") as HTMLSelectElement).value);
      formData.append("status", "COMPLETED");

      const res = await createPurchase(formData);
      if (res.success) {
        toast.success(res.success);
        onSuccess();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement de l'achat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label className="text-slate-600 dark:text-slate-300">
          Étudiant <span className="text-red-500">*</span>
        </Label>
        <StudentSearchSelect onSelect={(id) => setStudentId(id)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-600 dark:text-slate-300">Matière</Label>
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId as any}>
            <SelectTrigger className="border-slate-200 focus:ring-blue-500">
              <SelectValue placeholder="Sélectionner une matière">
                {selectedSubjectId === "all" 
                  ? "Toutes les matières" 
                  : subjects.find(s => s.id === selectedSubjectId)?.name || "Sélectionner une matière"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-600 dark:text-slate-300">
            Ressource (Cours) <span className="text-red-500">*</span>
          </Label>
          <Select value={selectedResourceId} onValueChange={setSelectedResourceId as any}>
            <SelectTrigger className="border-slate-200 focus:ring-blue-500">
              <SelectValue placeholder="Sélectionner une ressource">
                {resources.find(r => r.id === selectedResourceId)?.title || "Sélectionner une ressource"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {resources.length === 0 ? (
                <div className="p-2 text-sm text-slate-500">Aucune ressource disponible</div>
              ) : (
                resources.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title} ({r.price} MAD)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-600 dark:text-slate-300">
            Montant Payé (MAD) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder="0.00"
            required
            className="border-slate-200 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-600 dark:text-slate-300">Méthode de Paiement</Label>
          <Select name="method" defaultValue="CASH">
            <SelectTrigger className="border-slate-200 focus:ring-blue-500">
              <SelectValue placeholder="Sélectionner une méthode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Espèces</SelectItem>
              <SelectItem value="CARD">Carte Bancaire</SelectItem>
              <SelectItem value="TRANSFER">Virement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer l'achat"
          )}
        </Button>
      </div>
    </form>
  );
}
