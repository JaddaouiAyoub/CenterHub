"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createPaidFormationPurchase } from "@/actions/paidFormations";
import { StudentSearchSelect } from "@/components/dashboard/paid-resources/StudentSearchSelect";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FormationOption {
  id: string;
  name: string;
  price: number;
}

export function PaidFormationPurchaseForm({ formations }: { formations: FormationOption[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [studentSelectKey, setStudentSelectKey] = useState(0);
  const [formationId, setFormationId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [method, setMethod] = useState("CASH");
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleFormationChange = (id: string) => {
    setFormationId(id);
    const selection = formations.find((formation) => formation.id === id);
    setAmountPaid(selection?.price.toString() ?? "");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("formationId", formationId);
    formData.set("studentId", studentId);
    formData.set("amountPaid", amountPaid);
    formData.set("method", method);
    startTransition(async () => {
      const result = await createPaidFormationPurchase(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setStudentId("");
      setStudentSelectKey((key) => key + 1);
      setFormationId("");
      setAmountPaid("");
      setMethod("CASH");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger disabled={!formations.length} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
        <Plus className="h-4 w-4" />Enregistrer un paiement
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-700" />
            <DialogTitle>Enregistrer le paiement</DialogTitle>
          </div>
          <DialogDescription>Associez le paiement manuel à un étudiant et à une formation publiée.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Étudiant
            <StudentSearchSelect key={studentSelectKey} onSelect={(id) => setStudentId(id)} />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Formation
            <select required value={formationId} onChange={(event) => handleFormationChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800">
              <option value="">Choisir une formation</option>
              {formations.map((formation) => <option key={formation.id} value={formation.id}>{formation.name} · {formation.price.toLocaleString("fr-MA")} MAD</option>)}
            </select>
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Montant payé (MAD)
            <input required type="number" min="0" step="0.01" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Méthode
            <select value={method} onChange={(event) => setMethod(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800">
              <option value="CASH">Espèces</option>
              <option value="CARD">Carte bancaire</option>
              <option value="TRANSFER">Virement</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" disabled={pending} onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Annuler</button>
            <button disabled={pending || !studentId || !formationId} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}{pending ? "Enregistrement…" : "Confirmer le paiement"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
