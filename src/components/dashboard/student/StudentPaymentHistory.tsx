"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  BookOpen
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStudentPayments } from "@/actions/payments";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function StudentPaymentHistory({ profile }: { profile: any }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const res = await getStudentPayments(profile.id);
      if (res.payments) setPayments(res.payments);
      setLoading(false);
    };
    fetchPayments();
  }, [profile.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Chargement de vos paiements...</p>
      </div>
    );
  }

  const totalPaid = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalPartial = payments.filter(p => p.status === "PARTIAL").reduce((s, p) => s + p.amount, 0);

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    PAID:    { label: "Payé",      color: "text-emerald-700", bg: "bg-emerald-100", icon: CheckCircle2 },
    PENDING: { label: "En attente", color: "text-red-700",     bg: "bg-red-100",     icon: AlertCircle },
    PARTIAL: { label: "Partiel",   color: "text-amber-700",   bg: "bg-amber-100",   icon: Clock },
  };

  const methodLabel: Record<string, string> = {
    CASH: "Espèces",
    CARD: "Carte",
    TRANSFER: "Virement",
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <CheckCircle2 className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Total Payé</p>
            <h3 className="text-3xl font-black mt-2">{totalPaid.toFixed(0)} <span className="text-lg font-medium opacity-75">DHS</span></h3>
            <p className="text-emerald-100 text-xs mt-3">{payments.filter(p => p.status === "PAID").length} paiement(s) confirmé(s)</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">En Attente</p>
            <h3 className="text-3xl font-black mt-2 text-slate-900">{totalPending.toFixed(0)} <span className="text-lg font-normal text-slate-400">DHS</span></h3>
            <p className="text-red-500 text-xs mt-3 flex items-center font-bold">
              <AlertCircle className="w-3 h-3 mr-1" /> À régulariser
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border-l-4 border-l-amber-400">
          <CardContent className="p-6">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Paiements Partiels</p>
            <h3 className="text-3xl font-black mt-2 text-slate-900">{totalPartial.toFixed(0)} <span className="text-lg font-normal text-slate-400">DHS</span></h3>
            <p className="text-amber-500 text-xs mt-3 flex items-center font-bold">
              <Clock className="w-3 h-3 mr-1" /> Solde restant dû
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-lg font-black text-slate-900 flex items-center">
            <CreditCard className="w-5 h-5 mr-3 text-blue-600" />
            Historique des Paiements
          </h3>
        </div>

        {payments.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex p-6 bg-slate-50 rounded-full mb-4">
              <CreditCard className="w-12 h-12 text-slate-300" />
            </div>
            <p className="text-slate-400 italic">Aucun paiement enregistré.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {payments.map((p) => {
              const cfg = statusConfig[p.status] || statusConfig.PENDING;
              const StatusIcon = cfg.icon;
              return (
                <div key={p.id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${cfg.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-slate-900">{MONTHS[p.month - 1]} {p.year}</span>
                        <Badge className={`${cfg.bg} ${cfg.color} border-none text-[10px] font-black uppercase tracking-tighter`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      {p.courses && p.courses.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1 mt-1">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          {p.courses.map((c: any) => (
                            <span key={c.id} className="text-[10px] text-slate-500 font-medium">{c.subject?.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 sm:text-right">
                    <div>
                      <p className="text-xl font-black text-slate-900">{p.amount.toFixed(0)} DHS</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {methodLabel[p.method] || p.method} • {new Date(p.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
