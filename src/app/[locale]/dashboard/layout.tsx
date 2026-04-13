import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar"; // Will create this next

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role={session.user.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
