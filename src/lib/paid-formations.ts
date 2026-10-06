import "server-only";

import prisma from "@/lib/prisma";

export async function verifyStudentFormationPurchase(userId: string, formationId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!student) return false;
  const purchase = await prisma.paidFormationPurchase.findUnique({
    where: { formationId_studentId: { formationId, studentId: student.id } },
    select: { status: true },
  });
  return purchase?.status === "COMPLETED";
}

export async function getPaidFormationResourceStreamData(resourceId: string) {
  return prisma.paidFormationResource.findUnique({
    where: { id: resourceId },
    select: {
      source: true,
      driveFileId: true,
      externalUrl: true,
      mimeType: true,
      status: true,
      folder: { select: { formationId: true, formation: { select: { status: true } } } },
    },
  });
}
