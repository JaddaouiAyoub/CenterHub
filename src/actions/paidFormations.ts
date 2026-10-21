"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PaidFormationResourceStatus, PaidFormationResourceType, PaidFormationStatus } from "@prisma/client";
import { getFileMetadata } from "@/lib/google-drive";
import { getStudentProfileId, hasCompletedFormationPurchase } from "@/lib/paid-formations";

const MANAGER_ROLES = ["ADMIN", "TEACHER", "SECRETARY"];
const ADMIN_ROLES = ["ADMIN", "SECRETARY"];
const GRADER_ROLES = ["ADMIN", "TEACHER"];
const DEFAULT_EXAM_FOLDER_NAME = "Examen";
const EXAM_SUBMISSION_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);
async function requireRole(roles: string[]) {
  const session = await auth();
  if (!session) throw new Error("Non authentifié");
  if (!roles.includes(session.user.role)) throw new Error("Accès refusé");
  return session;
}

function revalidateFormationViews(formationId?: string) {
  revalidatePath("/dashboard/paid-formations");
  revalidatePath("/dashboard/paid-formations/purchases");
  if (formationId) revalidatePath(`/dashboard/paid-formations/${formationId}`);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Une erreur est survenue";
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function parseFormationStatus(status: string): PaidFormationStatus | null {
  return Object.values(PaidFormationStatus).includes(status as PaidFormationStatus)
    ? status as PaidFormationStatus
    : null;
}

function parseResourceStatus(status: string): PaidFormationResourceStatus | null {
  return Object.values(PaidFormationResourceStatus).includes(status as PaidFormationResourceStatus)
    ? status as PaidFormationResourceStatus
    : null;
}

export async function createPaidFormation(formData: FormData) {
  try {
    await requireRole(MANAGER_ROLES);
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const price = Number(formData.get("price"));
    const status = String(formData.get("status") || "DRAFT");

    if (!name) return { error: "Le nom de la formation est obligatoire" };
    if (!Number.isFinite(price) || price < 0) return { error: "Prix invalide" };
    const formationStatus = parseFormationStatus(status);
    if (!formationStatus) return { error: "Statut invalide" };

    const formation = await prisma.paidFormation.create({
      data: {
        name,
        description: description || null,
        price,
        status: formationStatus,
        folders: { create: { name: DEFAULT_EXAM_FOLDER_NAME, isExam: true } },
      },
      select: { id: true },
    });
    revalidateFormationViews(formation.id);
    return { success: "Formation créée", formationId: formation.id };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function setPaidFormationStatus(id: string, status: string) {
  try {
    await requireRole(MANAGER_ROLES);
    const formationStatus = parseFormationStatus(status);
    if (!formationStatus) return { error: "Statut invalide" };
    await prisma.paidFormation.update({ where: { id }, data: { status: formationStatus } });
    revalidateFormationViews(id);
    return { success: "Statut mis à jour" };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function createPaidFormationFolder(formData: FormData) {
  try {
    await requireRole(MANAGER_ROLES);
    const formationId = String(formData.get("formationId") || "");
    const name = String(formData.get("name") || "").trim();
    const parentId = String(formData.get("parentId") || "") || null;
    const isExam = formData.get("isExam") === "true";
    if (!formationId || !name || name.length > 100) return { error: "Nom du dossier invalide" };

    const formation = await prisma.paidFormation.findUnique({ where: { id: formationId }, select: { id: true } });
    if (!formation) return { error: "Formation introuvable" };
    if (parentId) {
      const parent = await prisma.paidFormationFolder.findFirst({
        where: { id: parentId, formationId },
        select: { id: true },
      });
      if (!parent) return { error: "Dossier parent invalide" };
    }
    const duplicate = await prisma.paidFormationFolder.findFirst({
      where: { formationId, parentId, name },
      select: { id: true },
    });
    if (duplicate) return { error: "Un dossier de ce nom existe déjà à cet endroit" };

    await prisma.paidFormationFolder.create({ data: { formationId, name, parentId, isExam } });
    revalidateFormationViews(formationId);
    return { success: "Dossier créé" };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "Un dossier de ce nom existe déjà à cet endroit" };
    return { error: errorMessage(error) };
  }
}

export async function renamePaidFormationFolder(id: string, name: string) {
  try {
    await requireRole(MANAGER_ROLES);
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 100) return { error: "Nom de dossier invalide" };
    const folder = await prisma.paidFormationFolder.findUnique({
      where: { id },
      select: { formationId: true, parentId: true },
    });
    if (!folder) return { error: "Dossier introuvable" };
    const duplicate = await prisma.paidFormationFolder.findFirst({
      where: { formationId: folder.formationId, parentId: folder.parentId, name: cleanName, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) return { error: "Un dossier de ce nom existe déjà à cet endroit" };
    await prisma.paidFormationFolder.update({ where: { id }, data: { name: cleanName } });
    revalidateFormationViews(folder.formationId);
    return { success: "Dossier renommé" };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "Un dossier de ce nom existe déjà à cet endroit" };
    return { error: errorMessage(error) };
  }
}

export async function deletePaidFormationFolder(id: string) {
  try {
    await requireRole(MANAGER_ROLES);
    const folder = await prisma.paidFormationFolder.findUnique({
      where: { id },
      select: {
        formationId: true,
        _count: { select: { children: true, resources: true, examSubmissions: true } },
      },
    });
    if (!folder) return { error: "Dossier introuvable" };
    if (folder._count.children || folder._count.resources || folder._count.examSubmissions) {
      return { error: "Déplacez ou supprimez le contenu avant de supprimer ce dossier" };
    }
    await prisma.paidFormationFolder.delete({ where: { id } });
    revalidateFormationViews(folder.formationId);
    return { success: "Dossier supprimé" };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

function typeFromMime(mimeType: string): PaidFormationResourceType | null {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return null;
}

function mimeTypeFromResourceType(type: PaidFormationResourceType) {
  if (type === "PDF") return "application/pdf";
  if (type === "IMAGE") return "image/jpeg";
  return "video/mp4";
}

function driveIdFromUrl(url: string) {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export async function createPaidFormationResource(formData: FormData) {
  try {
    await requireRole(MANAGER_ROLES);
    const folderId = String(formData.get("folderId") || "");
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const selectedType = String(formData.get("type") || "");
    const resourceType = Object.values(PaidFormationResourceType).includes(selectedType as PaidFormationResourceType)
      ? selectedType as PaidFormationResourceType
      : null;
    const folder = await prisma.paidFormationFolder.findUnique({
      where: { id: folderId },
      include: { formation: { select: { id: true, name: true } } },
    });
    if (!folder) return { error: "Dossier introuvable" };
    if (!title) return { error: "Le titre est obligatoire" };
    if (!resourceType) return { error: "Sélectionnez un type de ressource valide" };

    const externalUrl = String(formData.get("externalUrl") || "").trim();
    let parsedUrl: URL | null = null;
    if (externalUrl) {
      try {
        parsedUrl = new URL(externalUrl);
      } catch {
        return { error: "URL de ressource invalide" };
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) return { error: "L'URL doit utiliser HTTP ou HTTPS" };
    }
    if (!parsedUrl) return { error: "Ajoutez une URL de ressource" };

    const isDriveUrl = parsedUrl !== null && ["drive.google.com", "docs.google.com"].includes(parsedUrl.hostname.toLowerCase());
    const driveFileId = isDriveUrl ? driveIdFromUrl(parsedUrl.href) : null;
    let mimeType = mimeTypeFromResourceType(resourceType);

    if (driveFileId) {
      try {
        const metadata = await getFileMetadata(driveFileId);
        if (!ALLOWED_MIME_TYPES.has(metadata.mimeType)) return { error: "Type de fichier non autorisé" };
        const detectedType = typeFromMime(metadata.mimeType);
        if (detectedType && detectedType !== resourceType) {
          return { error: "Le type sélectionné ne correspond pas au fichier" };
        }
        mimeType = metadata.mimeType;
      } catch (error) {
        console.warn("Unable to read Google Drive metadata for formation resource:", error);
      }
    }

    const resource = await prisma.paidFormationResource.create({
      data: {
        title,
        description: description || null,
        folderId,
        driveFileId,
        externalUrl,
        mimeType,
        type: resourceType,
        source: "URL",
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    revalidateFormationViews(folder.formation.id);
    return { success: "Ressource ajoutée", resourceId: resource.id };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function deletePaidFormationResource(id: string) {
  try {
    await requireRole(MANAGER_ROLES);
    const resource = await prisma.paidFormationResource.findUnique({
      where: { id },
      select: { folder: { select: { formationId: true } } },
    });
    if (!resource) return { error: "Ressource introuvable" };

    await prisma.paidFormationResource.delete({ where: { id } });
    revalidateFormationViews(resource.folder.formationId);
    return { success: "Ressource retirée de la formation" };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function setPaidFormationResourceStatus(id: string, status: string) {
  try {
    await requireRole(MANAGER_ROLES);
    const resourceStatus = parseResourceStatus(status);
    if (!resourceStatus) return { error: "Statut invalide" };
    const resource = await prisma.paidFormationResource.update({
      where: { id },
      data: { status: resourceStatus },
      select: { folder: { select: { formationId: true } } },
    });
    revalidateFormationViews(resource.folder.formationId);
    return { success: "Ressource mise à jour" };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function movePaidFormationResource(id: string, targetFolderId: string) {
  try {
    await requireRole(MANAGER_ROLES);
    const [resource, targetFolder] = await Promise.all([
      prisma.paidFormationResource.findUnique({
        where: { id },
        select: { folder: { select: { formationId: true } } },
      }),
      prisma.paidFormationFolder.findUnique({
        where: { id: targetFolderId },
        select: { formationId: true },
      }),
    ]);
    if (!resource || !targetFolder) return { error: "Ressource ou dossier introuvable" };
    if (resource.folder.formationId !== targetFolder.formationId) {
      return { error: "Une ressource ne peut être déplacée qu'au sein de sa formation" };
    }
    await prisma.paidFormationResource.update({ where: { id }, data: { folderId: targetFolderId } });
    revalidateFormationViews(targetFolder.formationId);
    return { success: "Ressource déplacée" };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function submitPaidFormationExam(formData: FormData) {
  try {
    const session = await requireRole(["STUDENT"]);
    const folderId = String(formData.get("folderId") || "");
    const submissionUrl = String(formData.get("submissionUrl") || "").trim();
    const studentId = session.user.id ? await getStudentProfileId(session.user.id) : null;
    if (!studentId) return { error: "Profil étudiant introuvable" };

    const folder = await prisma.paidFormationFolder.findUnique({
      where: { id: folderId },
      select: {
        isExam: true,
        formationId: true,
        formation: { select: { status: true } },
        _count: { select: { resources: { where: { status: "PUBLISHED" } } } },
      },
    });
    if (!folder?.isExam || folder.formation.status !== "PUBLISHED") return { error: "Examen introuvable" };
    if (!folder._count.resources) return { error: "Cet examen n'est pas encore disponible" };
    if (!await hasCompletedFormationPurchase(studentId, folder.formationId)) return { error: "Accès refusé" };

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(submissionUrl);
    } catch {
      return { error: "URL Google Drive invalide" };
    }
    const isDriveUrl = parsedUrl.protocol === "https:"
      && ["drive.google.com", "docs.google.com"].includes(parsedUrl.hostname.toLowerCase());
    const driveFileId = isDriveUrl ? driveIdFromUrl(parsedUrl.href) : null;
    if (!driveFileId) return { error: "Collez le lien de partage d'un fichier Google Drive" };

    let mimeType = "application/pdf";
    try {
      const metadata = await getFileMetadata(driveFileId);
      if (!EXAM_SUBMISSION_MIME_TYPES.has(metadata.mimeType)) return { error: "La copie doit être un PDF ou une image" };
      mimeType = metadata.mimeType;
    } catch (error) {
      console.warn("Unable to read Google Drive metadata for exam submission:", error);
    }

    const existing = await prisma.paidFormationExamSubmission.findUnique({
      where: { folderId_studentId: { folderId, studentId } },
      select: { status: true },
    });
    if (existing?.status === "GRADED") return { error: "Votre copie a déjà été corrigée" };

    const data = { submissionUrl: parsedUrl.href, driveFileId, mimeType, submittedAt: new Date() };
    await prisma.paidFormationExamSubmission.upsert({
      where: { folderId_studentId: { folderId, studentId } },
      create: { folderId, studentId, ...data },
      update: data,
    });
    revalidateFormationViews(folder.formationId);
    return { success: existing ? "Copie remplacée" : "Examen soumis" };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function gradePaidFormationExam(formData: FormData) {
  try {
    const session = await requireRole(GRADER_ROLES);
    const submissionId = String(formData.get("submissionId") || "");
    const grade = Number(formData.get("grade"));
    const remarks = String(formData.get("remarks") || "").trim();
    if (!Number.isFinite(grade) || grade < 0 || grade > 20) return { error: "La note doit être comprise entre 0 et 20" };
    if (remarks.length > 2000) return { error: "Les remarques sont trop longues" };

    const submission = await prisma.paidFormationExamSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        remarks: remarks || null,
        status: "GRADED",
        gradedAt: new Date(),
        gradedById: session.user.id ?? null,
      },
      select: { folder: { select: { formationId: true } } },
    });
    revalidateFormationViews(submission.folder.formationId);
    return { success: "Note enregistrée" };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function createPaidFormationPurchase(formData: FormData) {
  try {
    await requireRole(ADMIN_ROLES);
    const formationId = String(formData.get("formationId") || "");
    const studentId = String(formData.get("studentId") || "");
    const amountPaid = Number(formData.get("amountPaid"));
    const method = String(formData.get("method") || "CASH");
    if (!formationId || !studentId) return { error: "Formation et étudiant requis" };
    if (!Number.isFinite(amountPaid) || amountPaid < 0) return { error: "Montant payé invalide" };
    if (!["CASH", "CARD", "TRANSFER"].includes(method)) return { error: "Méthode de paiement invalide" };

    const [formation, student] = await Promise.all([
      prisma.paidFormation.findUnique({ where: { id: formationId }, select: { id: true, status: true } }),
      prisma.studentProfile.findUnique({ where: { id: studentId }, select: { id: true } }),
    ]);
    if (!formation) return { error: "Formation introuvable" };
    if (formation.status !== "PUBLISHED") return { error: "Seules les formations publiées peuvent être payées" };
    if (!student) return { error: "Étudiant introuvable" };

    await prisma.$transaction([
      prisma.paidFormationPurchase.create({
        data: { formationId, studentId, amountPaid, method, status: "COMPLETED" },
      }),
      prisma.paidFormation.update({
        where: { id: formationId },
        data: { totalSales: { increment: 1 }, totalRevenue: { increment: amountPaid } },
      }),
    ]);
    revalidateFormationViews(formationId);
    return { success: "Paiement enregistré" };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "Cet étudiant a déjà acheté cette formation" };
    return { error: errorMessage(error) };
  }
}

export async function getPaidFormationPurchases() {
  try {
    await requireRole(ADMIN_ROLES);
    const purchases = await prisma.paidFormationPurchase.findMany({
      orderBy: { purchasedAt: "desc" },
      select: {
        id: true,
        amountPaid: true,
        method: true,
        status: true,
        purchasedAt: true,
        formation: { select: { id: true, name: true } },
        student: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });
    return { purchases };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

