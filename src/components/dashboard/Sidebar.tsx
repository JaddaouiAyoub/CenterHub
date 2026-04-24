"use client";

import { useTranslations } from "next-intl";
import { 
  BarChart, 
  Users, 
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
  Library,
  Bell,
  FileText,
  FolderOpen
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

export function SidebarContent({ role: sessionRole, onNavigate }: { role: string; onNavigate?: () => void }) {
  const t = useTranslations("dashboard");
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;

  const getLinks = () => {
    const base = `/${locale}/dashboard`;
    const role = sessionRole?.toUpperCase();
    const links: any[] = [
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
        { href: `${base}/students`, label: "Mes Étudiants", icon: BookOpen },
        { href: `${base}/resources`, label: "Ressources", icon: FolderOpen },
        { href: `${base}/grades`, label: t("gradesLink") || "Notes", icon: FileText },
        { href: `${base}/notifications`, label: "Notifications", icon: Bell }
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
        { href: `${base}/resources`, label: "Ressources", icon: FolderOpen },
        { href: `${base}/grades`, label: "Mes Notes", icon: FileText },
        { href: `${base}/payments`, label: "Mes Paiements", icon: CreditCard },
        { href: `${base}/notifications`, label: "Notifications", icon: Bell }
      );
    } else if (role === "SECRETARY") {
      links.push(
        { href: `${base}/teachers`, label: "Enseignants", icon: Users },
        { href: `${base}/students`, label: "Étudiants", icon: GraduationCap },
        { href: `${base}/subjects`, label: "Matières", icon: Library },
        { href: `${base}/classes`, label: "Classes", icon: School },
        { href: `${base}/resources`, label: "Ressources", icon: FolderOpen },
        { href: `${base}/courses`, label: "Cours", icon: Calendar },
        { href: `${base}/attendance`, label: "Absences", icon: BookOpenCheck },
        { href: `${base}/payments`, label: "Facturation", icon: CreditCard },
        { href: `${base}/notifications`, label: "Notifications", icon: Bell }
      );
    }

    return links;
  };

  const navLinks = getLinks();

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col w-full">
      <div className="p-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <GraduationCap className="w-8 h-8 text-blue-400 shrink-0" />
          <span className="text-xl font-bold tracking-tight">ObjectifPrepa </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link key={link.href} href={link.href} onClick={onNavigate}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm md:text-base">{link.label}</span>
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
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ role }: { role: string }) {
  return (
    <div className="hidden lg:flex w-64 h-full shrink-0">
      <SidebarContent role={role} />
    </div>
  );
}
