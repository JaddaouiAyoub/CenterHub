import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PaidResourceForm } from "@/components/dashboard/paid-resources/PaidResourceForm";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPaidResourcePage({ params }: Props) {
  const { locale, id } = await params;

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  if (!["ADMIN", "TEACHER", "SECRETARY"].includes(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const [resource, subjects, classes, teachers] = await Promise.all([
    prisma.paidResource.findUnique({ where: { id } }),
    prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.teacherProfile.findMany({
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  if (!resource) notFound();

  const defaultValues = {
    id: resource.id,
    title: resource.title,
    description: resource.description ?? "",
    price: resource.price,
    type: resource.type,
    source: resource.source,
    mimeType: resource.mimeType,
    driveFileId: resource.driveFileId ?? "",
    externalUrl: resource.externalUrl ?? "",
    subjectId: resource.subjectId ?? "",
    classId: resource.classId ?? "",
    teacherId: resource.teacherId ?? "",
    status: resource.status,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Modifier la ressource</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Modifiez les informations de la ressource payante
        </p>
      </div>
      <PaidResourceForm
        subjects={subjects}
        classes={classes}
        teachers={teachers}
        defaultValues={defaultValues}
        mode="edit"
      />
    </div>
  );
}
