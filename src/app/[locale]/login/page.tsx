"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "framer-motion";
import { login } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams } from "next/navigation";
import { GraduationCap } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black p-4">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl relative z-10"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/20"
          >
            <GraduationCap className="text-white w-10 h-10" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400"
          >
            ÉCOLE OBJECTIF PREPA
          </motion.h1>
          <p className="mt-2 text-sm text-slate-400 uppercase tracking-widest font-medium">
            Espace d'Excellence
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-slate-300 ml-1">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nom@exemple.com"
                className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-12 focus:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password" text-slate-300 ml-1>{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="rounded-xl bg-white/5 border-white/10 text-white h-12 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-rose-400 text-sm text-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            ) : t("signIn")}
          </Button>
        </form>

        <div className="flex justify-center items-center space-x-6 border-t border-white/5 pt-8">
          <a href="/fr/login" className={`text-sm transition-all ${locale === 'fr' ? 'font-bold text-white bg-white/10 px-3 py-1 rounded-full' : 'text-slate-500 hover:text-white'}`}>FR</a>
          <div className="w-px h-4 bg-white/10"></div>
          <a href="/ar/login" className={`text-sm transition-all ${locale === 'ar' ? 'font-bold text-white bg-white/10 px-3 py-1 rounded-full' : 'text-slate-500 hover:text-white'}`}>AR</a>
        </div>
      </motion.div>
    </div>
  );
}
