"use client";

import { User } from "next-auth";
import { 
  UserPlus, 
  CreditCard, 
  Files, 
  Search,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SecretaryView({ user }: { user: User }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bureau du Secrétariat</h1>
          <p className="text-slate-500 mt-1">Gestion administrative et financière quotidienne.</p>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" /> Nouvelle Inscription
          </Button>
          <Button variant="outline">
            <Files className="w-4 h-4 mr-2" /> Rapports
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Inscriptions ce mois</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">24</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-emerald-500 font-bold">+18%</span>
              <span className="text-slate-400 ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Paiements en attente</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">12</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-red-500 font-bold">
              Action requise
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Certificats délivrés</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">145</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Files className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Demandes d'inscription récentes</CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Rechercher..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Étudiant</th>
                  <th className="px-6 py-4 font-bold">Classe</th>
                  <th className="px-6 py-4 font-bold">Statut</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: "Marc Leroy", class: "Math 101", status: "Validé", date: "Hier" },
                  { name: "Amina Alai", class: "Arabe - N2", status: "En attente", date: "Aujourd'hui" },
                  { name: "Kevin Scott", class: "Physique", status: "Payé", date: "02/04" }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-400">{row.date}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.class}</td>
                    <td className="px-6 py-4">
                      <Badge variant={row.status === "Validé" ? "success" : "secondary"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Gérer</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// I need UserCircle, Badge
import { UserCircle } from "lucide-react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
