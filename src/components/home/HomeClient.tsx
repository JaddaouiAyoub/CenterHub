"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogIn, GraduationCap, Award, BookOpen, CheckCircle2 } from "lucide-react";

export default function HomeClient({ locale }: { locale: string }) {
  const t = useTranslations("landing");
  const router = useRouter();

  const handleLogin = () => {
    router.push(`/${locale}/login`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {t("title")}
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-4 border-r pr-6 border-slate-200">
              <a href={`/fr`} className={`text-sm ${locale === 'fr' ? 'font-bold text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>FR</a>
              <a href={`/ar`} className={`text-sm ${locale === 'ar' ? 'font-bold text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>AR</a>
            </div>
            <Button 
              onClick={handleLogin}
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {t("cta")}
            </Button>
          </div>
          
          {/* Mobile Login Button */}
          <div className="md:hidden">
            <Button 
              onClick={handleLogin}
              size="icon"
              className="bg-indigo-600 rounded-full h-10 w-10"
            >
              <LogIn size={18} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
                < Award className="mr-2 h-4 w-4" />
                {t("subtitle")}
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                L'excellence <span className="text-indigo-600 underline decoration-indigo-200 decoration-8 underline-offset-4">académique</span> à votre portée.
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-xl">
                {t("description")}
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  onClick={handleLogin}
                  className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-lg rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1"
                >
                  {t("cta")}
                </Button>
                <Button 
                  variant="outline"
                  className="h-14 px-8 text-lg border-2 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all"
                >
                  {t("contact")}
                </Button>
              </div>
              
              <div className="mt-12 grid grid-cols-3 gap-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="text-indigo-600 h-5 w-5" />
                  <span className="text-sm font-medium text-slate-500">Prépas Concours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="text-indigo-600 h-5 w-5" />
                  <span className="text-sm font-medium text-slate-500">Cours de Soutien</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="text-indigo-600 h-5 w-5" />
                  <span className="text-sm font-medium text-slate-500">Suivi 24/7</span>
                </div>
              </div>
            </motion.div>

            {/* Right Image (MODIFIÉE POUR ÊTRE CIRCULAIRE) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative flex justify-center lg:justify-end" // Centré sur mobile, à droite sur grand écran
            >
              {/* Conteneur de l'image principale mis à jour pour être un cercle parfait */}
              <div className="relative z-10 rounded-full overflow-hidden shadow-2xl border-[2px] border-white aspect-square w-full max-w-[450px]">
                <div className="relative w-full h-full">
                  <Image
                    src="/ahmed4.jpeg" // Chemin vers la nouvelle image circulaire
                    alt="Center Director"
                    fill
                    className="object-cover" // object-cover pour s'assurer qu'il remplit le cercle
                    priority
                  />
                </div>
              </div>
              
              {/* Éléments décoratifs (adaptés pour le format circulaire) */}
              <div className="absolute -top-6 -right-6 w-48 h-48 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-10 left-10 w-48 h-48 bg-pink-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
              
              {/* Badge d'expertise (repositionné légèrement pour le cercle) */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute bottom-4 -right-2 bg-white p-5 rounded-2xl shadow-2xl border border-slate-50 max-w-[190px] z-20"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expertise</p>
                </div>
                <p className="font-bold text-slate-900 text-sm">Plus de 15 ans d'expérience</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Feature section minimal */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Pourquoi choisir notre établissement ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "Programmes Intensifs", desc: "Des cursus optimisés pour la réussite aux concours les plus exigeants." },
              { icon: Award, title: "Meilleurs Taux de Réussite", desc: "Chaque année, nos étudiants intègrent les plus grandes écoles." },
              { icon: GraduationCap, title: "Corps Enseignant d'Elite", desc: "Des professeurs agrégés et ingénieurs passionnés par la pédagogie." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 italic">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          © {new Date().getFullYear()} {t("title")}. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}