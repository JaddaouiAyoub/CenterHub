import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PaidResourceForm } from "@/components/dashboard/paid-resources/PaidResourceForm";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NewPaidResourcePage({ params }: Props) {
  const { locale } = await params;

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  if (!["ADMIN", "TEACHER", "SECRETARY"].includes(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const [subjects, classes, teachers] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.teacherProfile.findMany({
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nouvelle ressource payante</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Uploadez un fichier sur Google Drive ou saisissez une URL externe
        </p>
      </div>
      <PaidResourceForm
        subjects={subjects}
        classes={classes}
        teachers={teachers}
        mode="create"
      />
    </div>
  );
}
