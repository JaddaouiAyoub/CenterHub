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
    <div className="min-h-screen flex items-center justify-center bg-[#05070A] relative overflow-hidden p-4">
      {/* Background Élite : Mesh Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/15 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Card Container */}
        <div className="bg-slate-900/40 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
          
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              whileHover={{ rotate: -5, scale: 1.05 }}
              className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]"
            >
              <GraduationCap className="text-white w-8 h-8" />
            </motion.div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2 uppercase italic">
              Objectif <span className="text-indigo-400">Prépa</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-widest uppercase opacity-70">
              {t("portal_subtitle") || "Plateforme Académique"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider italic">
                {t("email")}
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  className="w-full pl-11 h-13 bg-white/[0.03] border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:bg-white/[0.07] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider italic">
                  {t("password")}
                </Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-11 h-13 bg-white/[0.03] border-white/10 rounded-2xl text-white focus:bg-white/[0.07] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
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
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium p-3 rounded-xl flex items-center gap-2"
                >
                  <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 mt-4 relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all duration-300 group shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)]"
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

          {/* Language Switcher */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-white/10"></div>
            <div className="flex p-1 bg-black/20 rounded-full border border-white/5">
              {[
                { code: 'fr', label: 'FR' },
                { code: 'ar', label: 'AR' }
              ].map((lang) => (
                <a
                  key={lang.code}
                  href={`/${lang.code}/login`}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-tighter transition-all ${
                    locale === lang.code 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lang.label}
                </a>
              ))}
            </div>
            <div className="h-px w-8 bg-white/10"></div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center mt-8 text-slate-600 text-[10px] uppercase tracking-[0.2em]">
          Système sécurisé • Excellence & Réussite
        </p>
      </motion.div>
    </div>
  );
}