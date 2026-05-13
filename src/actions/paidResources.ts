"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { deleteFileFromDrive, getFileMetadata } from "@/lib/google-drive";
import {
  CreatePaidResourceSchema,
  UpdatePaidResourceSchema,
  CreatePurchaseSchema,
  ListPaidResourcesParamsSchema,
  ListPurchasesParamsSchema,
  type ListPaidResourcesParams,
  type ListPurchasesParams,
  type PaidResourceAnalytics,
} from "@/types/paid-resources";

// ─── RBAC helpers ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Non authentifié");
  if (!["ADMIN", "SECRETARY"].includes(session.user.role))
    throw new Error("Accès refusé : rôle insuffisant");
  return session;
}

async function requireAdminOrTeacher() {
  const session = await auth();
  if (!session) throw new Error("Non authentifié");
  if (!["ADMIN", "TEACHER", "SECRETARY"].includes(session.user.role))
    throw new Error("Accès refusé : rôle insuffisant");
  return session;
}

async function requireStudent() {
  const session = await auth();
  if (!session) throw new Error("Non authentifié");
  if (session.user.role !== "STUDENT") throw new Error("Accès refusé");
  return session;
}

function extractDriveId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ─── Shared select fragments (avoid N+1) ──────────────────────────────────────

const RESOURCE_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  type: true,
  mimeType: true,
  source: true,
  status: true,
  totalSales: true,
  totalRevenue: true,
  subjectId: true,
  classId: true,
  teacherId: true,
  createdAt: true,
  updatedAt: true,
  // NEVER select driveFileId or externalUrl — kept server-side only
  subject: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  teacher: { select: { id: true, user: { select: { name: true } } } },
} as const;

const PURCHASE_SELECT = {
  id: true,
  amountPaid: true,
  method: true,
  status: true,
  purchasedAt: true,
  resource: {
    select: {
      id: true,
      title: true,
      type: true,
      mimeType: true,
      source: true,
      subject: { select: { id: true, name: true } },
    },
  },
  student: {
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
} as const;

// ─── ADMIN: List paid resources ───────────────────────────────────────────────

export async function getPaidResources(rawParams: Partial<ListPaidResourcesParams> = {}) {
  try {
    await requireAdminOrTeacher();
    const params = ListPaidResourcesParamsSchema.parse(rawParams);
    const { page, pageSize, search, subjectId, classId, type, status, source, sortBy, sortDir } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (subjectId) where.subjectId = subjectId;
    if (classId) where.classId = classId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (source) where.source = source;

    const [resources, total] = await Promise.all([
      prisma.paidResource.findMany({
        where,
        select: RESOURCE_SELECT,
        orderBy: { [sortBy]: sortDir },
        skip,
        take: pageSize,
      }),
      prisma.paidResource.count({ where }),
    ]);

    return { resources, total, totalPages: Math.ceil(total / pageSize), page };
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la récupération" };
  }
}

// ─── ADMIN: Create paid resource ──────────────────────────────────────────────

export async function createPaidResource(formData: FormData) {
  try {
    await requireAdminOrTeacher();

    const raw = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      price: formData.get("price"),
      type: formData.get("type"),
      source: formData.get("source"),
      driveFileId: formData.get("driveFileId") || undefined,
      mimeType: formData.get("mimeType") || undefined,
      externalUrl: formData.get("externalUrl") || undefined,
      subjectId: formData.get("subjectId") || undefined,
      classId: formData.get("classId") || undefined,
      teacherId: formData.get("teacherId") || undefined,
      status: formData.get("status") || "DRAFT",
    };

    const parsed = CreatePaidResourceSchema.parse(raw);

    // Derive mimeType and type from Drive if link provided
    let mimeType = parsed.mimeType ?? "application/octet-stream";
    let type = parsed.type as any;

    const driveIdFromUrl = parsed.source === "URL" && parsed.externalUrl ? extractDriveId(parsed.externalUrl) : null;
    
    if (driveIdFromUrl || (parsed.source === "DRIVE" && parsed.driveFileId)) {
      const id = driveIdFromUrl || parsed.driveFileId!;
      try {
        const meta = await getFileMetadata(id);
        mimeType = meta.mimeType;
        if (mimeType === "application/pdf") type = "PDF";
        else if (mimeType.startsWith("image/")) type = "IMAGE";
        else if (mimeType.startsWith("video/")) type = "VIDEO";
      } catch (err) {
        console.error("Failed to fetch Drive metadata:", err);
      }
    } else if (parsed.source === "URL") {
      if (parsed.type === "PDF") mimeType = "application/pdf";
      else if (parsed.type === "IMAGE") mimeType = "image/jpeg";
      else if (parsed.type === "VIDEO") mimeType = "video/mp4";
    }
    
    // Enforce application/pdf if type is PDF and mimeType is generic
    if (type === "PDF" && (mimeType === "application/octet-stream" || !mimeType)) {
      mimeType = "application/pdf";
    }

    await prisma.paidResource.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        price: parsed.price,
        type,
        mimeType,
        source: parsed.source as any,
        driveFileId: driveIdFromUrl || (parsed.source === "DRIVE" ? parsed.driveFileId : null),
        externalUrl: parsed.source === "URL" ? parsed.externalUrl : null,
        status: parsed.status as any,
        subjectId: parsed.subjectId || null,
        classId: parsed.classId || null,
        teacherId: parsed.teacherId || null,
      },
    });

    revalidatePath("/dashboard/paid-resources");
    return { success: "Ressource créée avec succès" };
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la création" };
  }
}

// ─── ADMIN: Update paid resource ──────────────────────────────────────────────

export async function updatePaidResource(id: string, formData: FormData) {
  try {
    await requireAdminOrTeacher();

    const raw = {
      id,
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      price: formData.get("price"),
      type: formData.get("type"),
      source: formData.get("source"),
      driveFileId: formData.get("driveFileId") || undefined,
      mimeType: formData.get("mimeType") || undefined,
      externalUrl: formData.get("externalUrl") || undefined,
      subjectId: formData.get("subjectId") || undefined,
      classId: formData.get("classId") || undefined,
      teacherId: formData.get("teacherId") || undefined,
      status: formData.get("status") || undefined,
    };

    const parsed = UpdatePaidResourceSchema.parse(raw);

    const driveIdFromUrl = parsed.source === "URL" && parsed.externalUrl ? extractDriveId(parsed.externalUrl) : null;
    let driveFileId = driveIdFromUrl || (parsed.source === "DRIVE" ? parsed.driveFileId : undefined);

    let mimeType = parsed.mimeType;
    let type = parsed.type as any;

    if (driveFileId) {
      try {
        const meta = await getFileMetadata(driveFileId);
        mimeType = meta.mimeType;
        if (mimeType === "application/pdf") type = "PDF";
        else if (mimeType.startsWith("image/")) type = "IMAGE";
        else if (mimeType.startsWith("video/")) type = "VIDEO";
      } catch (err) {
        console.error("Failed to fetch Drive metadata on update:", err);
      }
    } else if (parsed.source === "URL" && parsed.type) {
      if (parsed.type === "PDF") mimeType = "application/pdf";
      else if (parsed.type === "IMAGE") mimeType = "image/jpeg";
      else if (parsed.type === "VIDEO") mimeType = "video/mp4";
    }

    // Enforce application/pdf if type is PDF and mimeType is generic
    if (type === "PDF" && (mimeType === "application/octet-stream" || !mimeType)) {
      mimeType = "application/pdf";
    }

    const updateData: any = {
      ...(parsed.title && { title: parsed.title }),
      ...(parsed.description !== undefined && { description: parsed.description }),
      ...(parsed.price !== undefined && { price: parsed.price }),
      ...(type && { type }),
      ...(mimeType && { mimeType }),
      ...(parsed.source && { source: parsed.source }),
      ...(parsed.status && { status: parsed.status }),
      subjectId: parsed.subjectId || null,
      classId: parsed.classId || null,
      teacherId: parsed.teacherId || null,
    };

    if (driveFileId) {
      updateData.driveFileId = driveFileId;
      updateData.externalUrl = parsed.source === "URL" ? parsed.externalUrl : null;
    } else if (parsed.source === "URL" && parsed.externalUrl) {
      updateData.externalUrl = parsed.externalUrl;
      updateData.driveFileId = null;
    }

    await prisma.paidResource.update({ where: { id }, data: updateData });
    revalidatePath("/dashboard/paid-resources");
    return { success: "Ressource mise à jour" };
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la mise à jour" };
  }
}

// ─── ADMIN: Delete paid resource ──────────────────────────────────────────────

export async function deletePaidResource(id: string) {
  try {
    await requireAdmin();

    const resource = await prisma.paidResource.findUnique({
      where: { id },
      select: { driveFileId: true, source: true },
    });

    if (!resource) return { error: "Ressource introuvable" };

    // Delete from Google Drive if applicable (best-effort — don't fail if Drive fails)
    if (resource.source === "DRIVE" && resource.driveFileId) {
      try {
        await deleteFileFromDrive(resource.driveFileId);
      } catch (driveErr) {
        console.error("Drive delete failed (non-blocking):", driveErr);
      }
    }

    await prisma.paidResource.delete({ where: { id } });
    revalidatePath("/dashboard/paid-resources");
    return { success: "Ressource supprimée" };
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la suppression" };
  }
}

// ─── ADMIN: Publish / Unpublish ───────────────────────────────────────────────

export async function publishPaidResource(id: string) {
  try {
    await requireAdminOrTeacher();
    await prisma.paidResource.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
    revalidatePath("/dashboard/paid-resources");
    return { success: "Ressource publiée" };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function unpublishPaidResource(id: string) {
  try {
    await requireAdminOrTeacher();
    await prisma.paidResource.update({
      where: { id },
      data: { status: "DRAFT" },
    });
    revalidatePath("/dashboard/paid-resources");
    return { success: "Ressource dépubliée" };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ─── ADMIN: Purchases management ──────────────────────────────────────────────

export async function getPaidResourcePurchases(rawParams: Partial<ListPurchasesParams> = {}) {
  try {
    await requireAdmin();
    const params = ListPurchasesParamsSchema.parse(rawParams);
    const { page, pageSize, search, resourceId, studentId, status, method, sortBy, sortDir } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (resourceId) where.resourceId = resourceId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (method) where.method = method;
    if (search) {
      where.OR = [
        { resource: { title: { contains: search, mode: "insensitive" } } },
        { student: { user: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [purchases, total] = await Promise.all([
      prisma.paidResourcePurchase.findMany({
        where,
        select: PURCHASE_SELECT,
        orderBy: { [sortBy]: sortDir },
        skip,
        take: pageSize,
      }),
      prisma.paidResourcePurchase.count({ where }),
    ]);

    return { purchases, total, totalPages: Math.ceil(total / pageSize), page };
  } catch (error: any) {
    return { error: error.message || "Erreur" };
  }
}

// ─── ADMIN: Create purchase ────────────────────────────────────────────────────

export async function createPurchase(formData: FormData) {
  try {
    await requireAdmin();

    const parsed = CreatePurchaseSchema.parse({
      resourceId: formData.get("resourceId"),
      studentId: formData.get("studentId"),
      amountPaid: formData.get("amountPaid"),
      method: formData.get("method") || "CASH",
      status: formData.get("status") || "COMPLETED",
    });

    // Verify resource exists and get its price
    const resource = await prisma.paidResource.findUnique({
      where: { id: parsed.resourceId },
      select: { id: true, price: true, title: true },
    });
    if (!resource) return { error: "Ressource introuvable" };

    // Verify student exists
    const student = await prisma.studentProfile.findUnique({
      where: { id: parsed.studentId },
      select: { id: true },
    });
    if (!student) return { error: "Étudiant introuvable" };

    // Create purchase + update denormalized counters atomically
    await prisma.$transaction([
      prisma.paidResourcePurchase.create({
        data: {
          resourceId: parsed.resourceId,
          studentId: parsed.studentId,
          amountPaid: parsed.amountPaid,
          method: parsed.method,
          status: parsed.status as any,
        },
      }),
      prisma.paidResource.update({
        where: { id: parsed.resourceId },
        data: {
          totalSales: { increment: 1 },
          totalRevenue: { increment: parsed.amountPaid },
        },
      }),
    ]);

    revalidatePath("/dashboard/paid-resources/purchases");
    return { success: "Achat enregistré avec succès" };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Cet étudiant a déjà acheté cette ressource" };
    }
    return { error: error.message || "Erreur lors de l'enregistrement" };
  }
}

// ─── ADMIN: Delete purchase ────────────────────────────────────────────────────

export async function deletePurchase(id: string) {
  try {
    await requireAdmin();

    const purchase = await prisma.paidResourcePurchase.findUnique({
      where: { id },
      select: { resourceId: true, amountPaid: true },
    });
    if (!purchase) return { error: "Achat introuvable" };

    await prisma.$transaction([
      prisma.paidResourcePurchase.delete({ where: { id } }),
      prisma.paidResource.update({
        where: { id: purchase.resourceId },
        data: {
          totalSales: { decrement: 1 },
          totalRevenue: { decrement: purchase.amountPaid },
        },
      }),
    ]);

    revalidatePath("/dashboard/paid-resources/purchases");
    return { success: "Achat supprimé" };
  } catch (error: any) {
    return { error: error.message || "Erreur" };
  }
}


// ─── STUDENT: All published resources with purchase status ────────────────────

export async function getStudentPublishedResources(rawParams: Partial<ListPaidResourcesParams> = {}) {
  try {
    const session = await auth();
    if (!session) throw new Error("Non authentifié");

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return { error: "Profil étudiant introuvable" };

    const params = ListPaidResourcesParamsSchema.parse(rawParams);
    const { page, pageSize, search, subjectId, type, sortBy, sortDir } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: "PUBLISHED",
    };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;

    const [resources, total, purchases] = await Promise.all([
      prisma.paidResource.findMany({
        where,
        select: RESOURCE_SELECT,
        orderBy: { [sortBy]: sortDir },
        skip,
        take: pageSize,
      }),
      prisma.paidResource.count({ where }),
      prisma.paidResourcePurchase.findMany({
        where: { studentId: profile.id, status: "COMPLETED" },
        select: { resourceId: true, purchasedAt: true },
      }),
    ]);

    const purchaseMap = new Map(purchases.map((p: { resourceId: any; purchasedAt: any; }) => [p.resourceId, p.purchasedAt]));

    const mappedResources = resources.map((r: { id: unknown; }) => ({
      ...r,
      isPurchased: purchaseMap.has(r.id),
      purchasedAt: purchaseMap.get(r.id) || null,
    }));

    return { 
      resources: mappedResources, 
      total, 
      totalPages: Math.ceil(total / pageSize), 
      page 
    };
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la récupération des ressources" };
  }
}

// ─── STUDENT: My purchases ────────────────────────────────────────────────────

export async function getStudentPurchases(rawParams: Partial<ListPurchasesParams> = {}) {
  try {
    const session = await auth();
    if (!session) throw new Error("Non authentifié");

    // Resolve StudentProfile from User id
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return { error: "Profil étudiant introuvable" };

    const params = ListPurchasesParamsSchema.parse(rawParams);
    const { page, pageSize, search, sortDir } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      studentId: profile.id,
      status: "COMPLETED",
    };
    if (search) {
      where.resource = { title: { contains: search, mode: "insensitive" } };
    }

    const [purchases, total] = await Promise.all([
      prisma.paidResourcePurchase.findMany({
        where,
        select: {
          id: true,
          amountPaid: true,
          method: true,
          status: true,
          purchasedAt: true,
          resource: {
            select: {
              id: true,
              title: true,
              type: true,
              mimeType: true,
              source: true,
              description: true,
              subject: { select: { id: true, name: true } },
              class: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { purchasedAt: sortDir },
        skip,
        take: pageSize,
      }),
      prisma.paidResourcePurchase.count({ where }),
    ]);

    return { purchases, total, totalPages: Math.ceil(total / pageSize), page };
  } catch (error: any) {
    return { error: error.message || "Erreur" };
  }
}

// ─── ADMIN: Analytics ────────────────────────────────────────────────────────

export async function getPaidResourceAnalytics(): Promise<
  { data: PaidResourceAnalytics } | { error: string }
> {
  try {
    await requireAdmin();

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalStats,
      allPurchases,
      topResources,
      allResourcesWithSubject,
      allResourcesWithTeacher,
      resourceCounts,
    ] = await Promise.all([
      // Global stats
      prisma.paidResource.aggregate({
        _sum: { totalRevenue: true, totalSales: true },
        _count: { id: true },
        _avg: { price: true },
      }),

      // All purchases for monthly chart (last 12 months)
      prisma.paidResourcePurchase.findMany({
        where: {
          purchasedAt: { gte: twelveMonthsAgo },
          status: "COMPLETED",
        },
        select: { purchasedAt: true, amountPaid: true },
        orderBy: { purchasedAt: "asc" },
      }),

      // Top 5 resources
      prisma.paidResource.findMany({
        select: { title: true, totalSales: true, totalRevenue: true },
        orderBy: { totalRevenue: "desc" },
        take: 5,
      }),

      // Revenue by subject
      prisma.paidResource.findMany({
        where: { subjectId: { not: null } },
        select: {
          totalRevenue: true,
          totalSales: true,
          subject: { select: { name: true } },
        },
      }),

      // Revenue by teacher
      prisma.paidResource.findMany({
        where: { teacherId: { not: null } },
        select: {
          totalRevenue: true,
          totalSales: true,
          teacher: { select: { user: { select: { name: true } } } },
        },
      }),

      // Count by type (for revenueByType)
      prisma.paidResource.groupBy({
        by: ["type"],
        _sum: { totalRevenue: true, totalSales: true },
      }),
    ]);

    // Build monthly revenue array
    const monthlyMap = new Map<string, { revenue: number; purchases: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { revenue: 0, purchases: 0 });
    }
    for (const p of allPurchases) {
      const d = new Date(p.purchasedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key)!;
        entry.revenue += p.amountPaid;
        entry.purchases += 1;
      }
    }
    const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, v]) => ({
      month,
      ...v,
    }));

    // Aggregate by subject
    const subjectMap = new Map<string, { totalRevenue: number; totalSales: number }>();
    for (const r of allResourcesWithSubject) {
      const name = r.subject?.name ?? "Inconnue";
      const existing = subjectMap.get(name) ?? { totalRevenue: 0, totalSales: 0 };
      subjectMap.set(name, {
        totalRevenue: existing.totalRevenue + r.totalRevenue,
        totalSales: existing.totalSales + r.totalSales,
      });
    }
    const topSubjects = Array.from(subjectMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Aggregate by teacher
    const teacherMap = new Map<string, { totalRevenue: number; totalSales: number }>();
    for (const r of allResourcesWithTeacher) {
      const name = r.teacher?.user?.name ?? "Inconnu";
      const existing = teacherMap.get(name) ?? { totalRevenue: 0, totalSales: 0 };
      teacherMap.set(name, {
        totalRevenue: existing.totalRevenue + r.totalRevenue,
        totalSales: existing.totalSales + r.totalSales,
      });
    }
    const topTeachers = Array.from(teacherMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Published vs total
    const publishedCount = await prisma.paidResource.count({
      where: { status: "PUBLISHED" },
    });

    return {
      data: {
        totalRevenue: totalStats._sum.totalRevenue ?? 0,
        totalPurchases: totalStats._sum.totalSales ?? 0,
        totalResources: totalStats._count.id,
        publishedResources: publishedCount,
        averagePrice: totalStats._avg.price ?? 0,
        monthlyRevenue,
        topResources,
        topSubjects,
        topTeachers,
        revenueByType: resourceCounts.map((r: { type: any; _sum: { totalRevenue: any; totalSales: any; }; }) => ({
          type: r.type,
          revenue: r._sum.totalRevenue ?? 0,
          count: r._sum.totalSales ?? 0,
        })),
      },
    };
  } catch (error: any) {
    return { error: error.message || "Erreur analytics" };
  }
}

// ─── Shared: All published resources for select ──────────────────────────────

export async function getAllResourcesForSelect(subjectId?: string) {
  try {
    const where: any = { status: "PUBLISHED" };
    if (subjectId) where.subjectId = subjectId;

    const resources = await prisma.paidResource.findMany({
      where,
      select: { id: true, title: true, price: true, subjectId: true },
      orderBy: { title: "asc" },
    });
    return { resources };
  } catch (error) {
    return { error: "Erreur lors de la récupération des ressources" };
  }
}

// ─── Internal: verify student owns purchase (used by stream route) ───────────

export async function verifyStudentPurchase(
  userId: string,
  resourceId: string
): Promise<boolean> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return false;

  const purchase = await prisma.paidResourcePurchase.findUnique({
    where: { resourceId_studentId: { resourceId, studentId: profile.id } },
    select: { id: true, status: true },
  });

  return !!purchase && purchase.status === "COMPLETED";
}

// ─── Internal: get drive file id for streaming (server-only) ─────────────────

export async function getResourceStreamData(
  resourceId: string
): Promise<{ source: string; driveFileId: string | null; externalUrl: string | null; mimeType: string; status: string } | null> {
  const resource = await prisma.paidResource.findUnique({
    where: { id: resourceId },
    select: {
      source: true,
      driveFileId: true,
      externalUrl: true,
      mimeType: true,
      status: true,
    },
  });

  return resource;
}
