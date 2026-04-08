"use client";

import { User } from "next-auth";
import { 
  Heart, 
  TrendingUp, 
  Clock, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ParentView({ user }: { user: User }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Espace Parent</h1>
        <p className="text-slate-500 mt-1">Suivez les progrès et l'assiduité de vos enfants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Enfant suivi</p>
                <h3 className="text-xl font-bold mt-1 text-white">Sara Dupont</h3>
                <p className="text-blue-100 text-xs mt-2 uppercase tracking-wider font-semibold">Terminale - Groupe A</p>
              </div>
              <Heart className="w-8 h-8 text-blue-200 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Moyenne Générale</p>
                <h3 className="text-xl font-bold mt-1 text-slate-900">16.4 / 20</h3>
                <p className="text-emerald-500 text-xs mt-2 flex items-center font-semibold">
                  <TrendingUp className="w-3 h-3 mr-1" /> En progression
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Absences</p>
                <h3 className="text-xl font-bold mt-1 text-slate-900">2 jours</h3>
                <p className="text-orange-500 text-xs mt-2 flex items-center font-semibold">
                  <Clock className="w-3 h-3 mr-1" /> Dernier : 05 Avril
                </p>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Dernières évaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { subject: "Mathématiques", date: "07 Avril", grade: "18/20", type: "Devoir Surveillé" },
                { subject: "Physique", date: "03 Avril", grade: "14/20", type: "Quiz" },
                { subject: "Anglais", date: "01 Avril", grade: "17/20", type: "Oral" }
              ].map((val, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{val.subject}</p>
                    <p className="text-xs text-slate-500">{val.type} • {val.date}</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{val.grade}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-3 p-3 bg-blue-50/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-sm text-slate-700">Réunion parents-profs ce vendredi à 18h.</p>
              </div>
              <div className="flex space-x-3 p-3 bg-slate-50 rounded-lg">
                <MessageSquare className="w-5 h-5 text-slate-400 shrink-0" />
                <p className="text-sm text-slate-700">Nouveau message de l'administration.</p>
              </div>
              <Button variant="outline" className="w-full mt-4">Voir tout</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
