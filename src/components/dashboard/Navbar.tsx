"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { User } from "next-auth";
import { 
  Search, 
  Globe,
  Settings,
  User as UserIcon,
  Menu
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useParams, useRouter, usePathname } from "next/navigation";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { SidebarContent } from "@/components/dashboard/Sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
      <div className="flex-1 flex items-center gap-2 sm:gap-4">
        {/* Mobile Menu Trigger */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger 
            render={
              <Button variant="ghost" size="icon" className="lg:hidden text-slate-600">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="p-0 w-64 sm:w-72 bg-slate-900 border-r-0" showCloseButton={false}>
            <SidebarContent role={user.role as string} onNavigate={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="relative w-full max-w-[200px] sm:max-w-xs md:max-w-md lg:w-64">
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

        <NotificationBell
          userId={user.id!}
          role={user.role as string}
        />

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
