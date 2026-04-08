"use client";

import { User } from "next-auth";
import { 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  Clock,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function TeacherView({ user }: { user: User }) {
  const schedule = [
    { time: "08:30", course: "Mathématiques", class: "Terminale A", room: "Sall 102" },
    { time: "10:30", course: "Physique", class: "2nde C", room: "Labo 1" },
    { time: "14:00", course: "Algèbre", class: "1ère B", room: "Salle 204" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Espace Enseignant</h1>
        <p className="text-slate-500 mt-1">Gérez vos cours, vos notes et vos élèves.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={item}>
          <Card className="border-none shadow-sm bg-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Prochain cours</p>
                  <h3 className="text-xl font-bold mt-1">Mathématiques</h3>
                  <p className="text-blue-100 text-xs mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Dans 15 minutes
                  </p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Étudiants total</p>
                  <h3 className="text-xl font-bold mt-1 text-slate-900">142</h3>
                  <p className="text-emerald-600 text-xs mt-2 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> 98% présence
                  </p>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Messages non lus</p>
                  <h3 className="text-xl font-bold mt-1 text-slate-900">7</h3>
                  <p className="text-blue-600 text-xs mt-2 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> Nouveaux messages
                  </p>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Emploi du temps du jour</CardTitle>
            <Button variant="outline" size="sm">Tout voir</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.map((slot, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600 font-bold text-xs w-14 text-center">
                      {slot.time}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{slot.course}</h4>
                      <p className="text-xs text-slate-500">{slot.class} • {slot.room}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Dernières notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { student: "Sara B.", score: "18/20", task: "Devoir Math" },
                { student: "Ahmed K.", score: "15/20", task: "Quiz Physique" },
                { student: "Youssef L.", score: "12/20", task: "Devoir Math" }
              ].map((note, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{note.student}</p>
                    <p className="text-xs text-slate-500">{note.task}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{note.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// I need to import Activity and Button too.
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
