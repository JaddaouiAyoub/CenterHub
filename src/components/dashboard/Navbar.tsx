"use client";

import { useTranslations } from "next-intl";
import { User } from "next-auth";
import { 
  Bell, 
  Search, 
  Globe,
  Settings,
  User as UserIcon
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useParams, useRouter, usePathname } from "next/navigation";

export function Navbar({ user }: { user: User }) {
  const t = useTranslations("dashboard");
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params.locale as string;

  const toggleLocale = () => {
    const newLocale = locale === "fr" ? "ar" : "fr";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div className="flex-1 flex items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-inter"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <Button variant="ghost" size="icon" onClick={toggleLocale} title="Change Language">
          <Globe className="w-5 h-5 text-slate-600" />
          <span className="sr-only">Language</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative text-slate-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </Button>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-3 rtl:space-x-reverse hover:bg-slate-50 p-1 rounded-lg transition-colors outline-none">
            <div className="text-right rtl:text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <UserIcon className="w-4 h-4 mr-2 rtl:ml-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2 rtl:ml-2" />
              Paramètres
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
