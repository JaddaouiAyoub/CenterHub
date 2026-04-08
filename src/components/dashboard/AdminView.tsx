"use client";

import { User } from "next-auth";
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  TrendingUp,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function AdminView({ user }: { user: User }) {
  const stats = [
    { title: "Total Étudiants", value: "1,234", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Enseignants actifs", value: "48", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Revenus mensuels", value: "54,200 €", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Croissance", value: "+12.5%", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Console d'administration</h1>
        <p className="text-slate-500 mt-1">Gérez votre établissement et visualisez les performances.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={stat.bg + " p-3 rounded-xl " + stat.color}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="bg-slate-50 p-1 rounded-md group-hover:bg-slate-100 transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Activité récente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Nouvelle inscription : Jean Dupont</p>
                    <p className="text-xs text-slate-500">Il y a 15 minutes • Secrétariat</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Statut des classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Mathématiques 101", status: "En cours", color: "text-emerald-500" },
                { name: "Physique - Terminale", status: "Programmé", color: "text-blue-500" },
                { name: "Langue Arabe - Niveau 2", status: "Terminé", color: "text-slate-500" }
              ].map((cls, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{cls.name}</span>
                  <span className={"text-xs font-bold uppercase " + cls.color}>{cls.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
