"use client";

import { useTranslations } from "next-intl";
import { 
  BarChart, 
  Users, 
  UserCircle, 
  BookOpen, 
  Settings, 
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Calendar,
  MessageSquare,
  GraduationCap,
  BookOpenCheck,
  CreditCard,
  School,
  Library
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

export function Sidebar({ role }: { role: string }) {
  const t = useTranslations("dashboard");
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;

  const getLinks = () => {
    const base = `/${locale}/dashboard`;
    const links = [
      { href: base, label: t("title"), icon: LayoutDashboard },
    ];

    if (role === "ADMIN") {
      links.push(
        { href: `${base}/users`, label: "Utilisateurs", icon: Users },
        { href: `${base}/settings`, label: "Paramètres", icon: Settings }
      );
    } else if (role === "TEACHER") {
      links.push(
        { href: `${base}/schedule`, label: "Emploi du temps", icon: Calendar },
        { href: `${base}/attendance`, label: "Mes Absences", icon: BookOpenCheck },
        { href: `${base}/students`, label: "Mes Étudiants", icon: BookOpen }
      );
    } else if (role === "PARENT") {
      links.push(
        { href: `${base}/progress`, label: "Suivi Enfant", icon: BarChart },
        { href: `${base}/messages`, label: "Messages", icon: MessageSquare }
      );
    } else if (role === "STUDENT") {
      links.push(
        { href: `${base}/schedule`, label: "Emploi du Temps", icon: Calendar },
        { href: `${base}/attendance`, label: "Mes Absences", icon: BookOpenCheck },
        { href: `${base}/resources`, label: "Ressources", icon: Library },
        { href: `${base}/payments`, label: "Mes Paiements", icon: CreditCard }
      );
    } else if (role === "SECRETARY") {
      links.push(
        { href: `${base}/teachers`, label: "Enseignants", icon: Users },
        { href: `${base}/students`, label: "Étudiants", icon: GraduationCap },
        { href: `${base}/subjects`, label: "Matières", icon: Library },
        { href: `${base}/classes`, label: "Classes", icon: School },
        { href: `${base}/courses`, label: "Cours", icon: Calendar },
        { href: `${base}/attendance`, label: "Absences", icon: BookOpenCheck },
        { href: `${base}/payments`, label: "Facturation", icon: CreditCard }
      );
    }

    return links;
  };

  const navLinks = getLinks();

  return (
    <div className="w-64 h-full bg-slate-900 text-white flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-bold tracking-tight">CenterHub</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className="flex items-center space-x-3 rtl:space-x-reverse w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}
