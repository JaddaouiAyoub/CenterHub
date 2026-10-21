import "server-only";

import prisma from "@/lib/prisma";

export async function getStudentProfileId(userId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
  return student?.id ?? null;
}

export async function verifyStudentFormationPurchase(userId: string, formationId: string) {
  const studentId = await getStudentProfileId(userId);
  if (!studentId) return false;
  return hasCompletedFormationPurchase(studentId, formationId);
}

export async function hasCompletedFormationPurchase(studentId: string, formationId: string) {
  const purchase = await prisma.paidFormationPurchase.findUnique({
    where: { formationId_studentId: { formationId, studentId } },
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

export async function getPaidFormationExamSubmission(submissionId: string) {
  return prisma.paidFormationExamSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      folderId: true,
      studentId: true,
      driveFileId: true,
      mimeType: true,
      status: true,
      grade: true,
      remarks: true,
      submittedAt: true,
      student: { select: { user: { select: { name: true } } } },
      folder: { select: { name: true, formationId: true, formation: { select: { name: true } } } },
    },
  });
}

/** Les gestionnaires voient toutes les copies ; un étudiant uniquement la sienne. */
export async function canReadExamSubmission(
  user: { id?: string; role: string },
  submission: { studentId: string },
) {
  if (["ADMIN", "TEACHER", "SECRETARY"].includes(user.role)) return true;
  if (user.role !== "STUDENT" || !user.id) return false;
  return (await getStudentProfileId(user.id)) === submission.studentId;
}
