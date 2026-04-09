"use client";

import { useState, useEffect } from "react";
import { getPayments, createPayment, deletePayment, updatePaymentStatus, updatePayment } from "@/actions/payments";
import { getStudents } from "@/actions/students";
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
import { CreditCard, Trash2, Plus, Search, DollarSign, Wallet, Edit, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function PaymentManager() {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [p, s] = await Promise.all([getPayments(), getStudents()]);
      if (p.payments) setPayments(p.payments);
      if (p.error) toast.error(p.error);
      if (s.students) setStudents(s.students);
    } catch (error) {
      toast.error("Erreur de chargement des paiements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createPayment(formData);
    if (res.success) {
      toast.success("Paiement enregistré");
      setIsPaymentOpen(false);
      fetchData();
    } else {
      toast.error(res.error || "Échec de l'enregistrement");
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await updatePayment(editingPayment.id, formData);
    if (res.success) {
      toast.success("Paiement mis à jour");
      setEditingPayment(null);
      fetchData();
    } else {
      toast.error(res.error || "Échec de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cet historique de paiement ?")) {
      const res = await deletePayment(id);
      if (res.success) {
        toast.success("Paiement supprimé");
        fetchData();
      } else {
        toast.error(res.error || "Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Suivi Financier</h2>
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogTrigger render={
            <Button className="bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-200">
              <Plus className="w-4 h-4 mr-2" /> Enregistrer un paiement
            </Button>
          } />

          <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-white text-xl">Nouveau Paiement</DialogTitle>
              <p className="text-amber-100 text-sm mt-1">Enregistrez une transaction pour un étudiant.</p>
            </div>
            <form onSubmit={handleCreatePayment} className="p-6 space-y-4 bg-white">
              <div className="space-y-2">
                <Label className="text-slate-600">Étudiant</Label>
                <Select name="studentId" required>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Choisir l'étudiant">
                      {(val: any) => val ? students.find(s => s.studentProfile?.id?.toString() === val.toString())?.name || val : "Choisir l'étudiant"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.studentProfile?.id} value={s.studentProfile?.id?.toString()} label={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Montant (DHS)</Label>
                  <Input name="amount" type="number" step="0.01" required className="border-slate-200 focus:ring-amber-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Moyen</Label>
                  <Select name="method" defaultValue="CASH">
                    <SelectTrigger className="border-slate-200">
                      <SelectValue>
                        {(val: any) => val === "CASH" ? "Espèces" : val === "CARD" ? "Carte" : val === "TRANSFER" ? "Virement" : val}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH" label="Espèces">Espèces</SelectItem>
                      <SelectItem value="CARD" label="Carte">Carte</SelectItem>
                      <SelectItem value="TRANSFER" label="Virement">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Mois</Label>
                  <Select name="month" defaultValue={(new Date().getMonth() + 1).toString()}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Mois">
                        {(val: any) => val ? MONTHS[parseInt(val, 10) - 1] || val : "Mois"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={(i + 1).toString()} label={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Année</Label>
                  <Input name="year" type="number" defaultValue={new Date().getFullYear().toString()} className="border-slate-200 focus:ring-amber-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Statut</Label>
                <Select name="status" defaultValue="PAID">
                  <SelectTrigger className="border-slate-200">
                    <SelectValue>
                      {(val: any) => val === "PAID" ? "Payé" : val === "PENDING" ? "En attente" : val === "PARTIAL" ? "Partiel" : val}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID" label="Payé">Payé</SelectItem>
                    <SelectItem value="PENDING" label="En attente">En attente</SelectItem>
                    <SelectItem value="PARTIAL" label="Partiel">Partiel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 h-12">Confirmer le paiement</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="bg-gradient-to-r from-orange-600 to-amber-700 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-white text-xl">Modifier le Paiement</DialogTitle>
            <p className="text-amber-100 text-sm mt-1">Mise à jour des informations de paiement.</p>
          </div>
          <form onSubmit={handleUpdatePayment} className="p-6 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="text-slate-600">Étudiant</Label>
              <Select key={`student-${editingPayment?.id}`} name="studentId" defaultValue={editingPayment?.studentId?.toString()} disabled>
                <SelectTrigger className="border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Chargement...">
                    {(val: any) => val ? students.find(s => s.studentProfile?.id?.toString() === val.toString())?.name || val : "Chargement..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.studentProfile?.id} value={s.studentProfile?.id?.toString()} label={s.name || s.user.name}>{s.name || s.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Montant (DHS)</Label>
                <Input key={`amount-${editingPayment?.id}`} name="amount" type="number" step="0.01" defaultValue={editingPayment?.amount} required className="border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Moyen</Label>
                <Select key={`method-${editingPayment?.id}`} name="method" defaultValue={editingPayment?.method}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue>
                      {(val: any) => val === "CASH" ? "Espèces" : val === "CARD" ? "Carte" : val === "TRANSFER" ? "Virement" : val}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH" label="Espèces">Espèces</SelectItem>
                    <SelectItem value="CARD" label="Carte">Carte</SelectItem>
                    <SelectItem value="TRANSFER" label="Virement">Virement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Mois</Label>
                <Select key={`month-${editingPayment?.id}`} name="month" defaultValue={editingPayment?.month?.toString()}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Mois">
                      {(val: any) => val ? MONTHS[parseInt(val, 10) - 1] || val : "Mois"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()} label={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Année</Label>
                <Input key={`year-${editingPayment?.id}`} name="year" type="number" defaultValue={editingPayment?.year} className="border-slate-200" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Statut</Label>
              <Select key={`status-${editingPayment?.id}`} name="status" defaultValue={editingPayment?.status}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue>
                    {(val: any) => val === "PAID" ? "Payé" : val === "PENDING" ? "En attente" : val === "PARTIAL" ? "Partiel" : val}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID" label="Payé">Payé</SelectItem>
                  <SelectItem value="PENDING" label="En attente">En attente</SelectItem>
                  <SelectItem value="PARTIAL" label="Partiel">Partiel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 h-12">Sauvegarder les modifications</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Étudiant</TableHead>
              <TableHead className="font-semibold text-slate-700">Période</TableHead>
              <TableHead className="font-semibold text-slate-700">Montant</TableHead>
              <TableHead className="font-semibold text-slate-700">Statut</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400 italic">Chargement des transactions...</TableCell></TableRow>
            ) : payments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Aucun paiement enregistré.</TableCell></TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-xs font-bold">
                        {p.student.user.name.charAt(0)}
                      </div>
                      <span>{p.student.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500 uppercase">
                        {MONTHS[p.month - 1]} {p.year}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {p.amount.toFixed(2)} DHS
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal uppercase tracking-wider">{p.method}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`
                      px-3 py-1 rounded-full text-[10px] font-bold border-none
                      ${p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : p.status === "PARTIAL" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}
                    `}>
                      {p.status === "PAID" ? "PAYÉ" : p.status === "PARTIAL" ? "PARTIEL" : "ATTENTE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                      onClick={() => setEditingPayment(p)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(p.id)}
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

