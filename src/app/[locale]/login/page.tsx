"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { login } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams } from "next/navigation";
import { GraduationCap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("locale", locale);
    
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    /* Changement du fond : de bg-[#05070A] à un gris très clair ardoise */
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-4">
      
      {/* Background Élite : Mesh Gradients adaptés pour le mode clair */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Card Container : Fond blanc pur avec bordure subtile et ombre douce */}
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
          
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              whileHover={{ rotate: -5, scale: 1.05 }}
              className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_10px_20px_rgba(79,70,229,0.2)]"
            >
              <GraduationCap className="text-white w-8 h-8" />
            </motion.div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2 uppercase italic">
              Objectif <span className="text-indigo-600">Prépa</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium tracking-widest uppercase opacity-80">
              {t("portal_subtitle") || "Plateforme Académique"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-600 ml-1 uppercase tracking-wider">
                {t("email")}
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  className="w-full pl-11 h-13 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {t("password")}
                </Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-11 h-13 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                />
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold p-3 rounded-xl flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 mt-4 relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all duration-300 group shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t("signIn")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Language Switcher : Plus soft en mode clair */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-slate-200"></div>
            <div className="flex p-1 bg-slate-100 rounded-full border border-slate-200">
              {[
                { code: 'fr', label: 'FR' },
                { code: 'ar', label: 'AR' }
              ].map((lang) => (
                <a
                  key={lang.code}
                  href={`/${lang.code}/login`}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-tighter transition-all ${
                    locale === lang.code 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lang.label}
                </a>
              ))}
            </div>
            <div className="h-px w-8 bg-slate-200"></div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center mt-8 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-medium">
          Système sécurisé • Excellence & Réussite
        </p>
      </motion.div>
    </div>
  );
}