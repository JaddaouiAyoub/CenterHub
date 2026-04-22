"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSubjectResources(params: {
  search?: string;
  subjectId?: string;
  classId?: string;
  studentId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search = "", subjectId, classId, studentId, page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  try {
    const where: any = {};
    
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    
    if (subjectId && subjectId !== "all") {
      where.subjectId = subjectId;
    }

    if (classId && classId !== "all") {
      where.classes = { some: { id: classId } };
    }

    if (studentId) {
      where.classes = { some: { students: { some: { userId: studentId } } } };
    }

    const [resources, total] = await Promise.all([
      prisma.subjectResource.findMany({
        where,
        include: {
          subject: {
            select: { id: true, name: true }
          },
          classes: {
            select: { id: true, name: true }
          },
          _count: {
            select: { views: true }
          },
          ...(studentId ? {
            views: {
              where: { student: { userId: studentId } },
              select: { id: true }
            }
          } : {})
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.subjectResource.count({ where })
    ]);

    const mappedResources = resources.map((res: any) => {
      const { views, _count, ...rest } = res;
      return {
        ...rest,
        viewsCount: _count?.views || 0,
        isViewed: studentId ? (views && views.length > 0) : undefined
      };
    });

    return {
      resources: mappedResources,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error(error);
    return { error: "Erreur lors de la récupération des ressources" };
  }
}

export async function createSubjectResource(formData: FormData) {
  const name = formData.get("name") as string;
  const link = formData.get("link") as string;
  const subjectId = formData.get("subjectId") as string;
  const classIds = formData.getAll("classIds") as string[];

  if (!name || !link || !subjectId || !classIds.length) {
    return { error: "Tous les champs sont obligatoires (inclure au moins une classe)" };
  }

  try {
    await prisma.subjectResource.create({
      data: {
        name,
        link,
        subjectId,
        classes: {
          connect: classIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath("/dashboard/resources");
    return { success: "Ressource créée avec succès" };
  } catch (error) {
    console.error(error);
    return { error: "Erreur lors de la création de la ressource" };
  }
}

export async function updateSubjectResource(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const link = formData.get("link") as string;
  const subjectId = formData.get("subjectId") as string;
  const classIds = formData.getAll("classIds") as string[];

  try {
    const data: any = {
      name,
      link,
      subjectId,
    };

    if (classIds.length > 0) {
      data.classes = {
        set: classIds.map(id => ({ id }))
      };
    }

    await prisma.subjectResource.update({
      where: { id },
      data
    });

    revalidatePath("/dashboard/resources");
    return { success: "Ressource mise à jour avec succès" };
  } catch (error) {
    console.error(error);
    return { error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteSubjectResource(id: string) {
  try {
    await prisma.subjectResource.delete({
      where: { id }
    });

    revalidatePath("/dashboard/resources");
    return { success: "Ressource supprimée avec succès" };
  } catch (error) {
    console.error(error);
    return { error: "Erreur lors de la suppression" };
  }
}

export async function markSubjectResourceViewed(subjectResourceId: string, userId: string) {
  if (!userId || !subjectResourceId) return { error: "Paramètres manquants" };
  
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) return { error: "Profil d'étudiant introuvable" };
    
    await prisma.subjectResourceView.upsert({
      where: {
        studentId_subjectResourceId: {
          studentId: profile.id,
          subjectResourceId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        studentId: profile.id,
        subjectResourceId
      }
    });

    revalidatePath("/dashboard/resources");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erreur lors du marquage de la vue" };
  }
}

export async function getUnreadSubjectResourcesCount(userId: string) {
  if (!userId) return 0;
  
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) return 0;
    
    // Count total resources assigned to classes the student is in
    const totalResources = await prisma.subjectResource.count({
      where: {
        classes: { some: { students: { some: { id: profile.id } } } }
      }
    });
    
    // Count how many view records exist for this student for subject resources
    const viewedResources = await prisma.subjectResourceView.count({
      where: {
        studentId: profile.id,
        subjectResource: {
          classes: { some: { students: { some: { id: profile.id } } } }
        }
      }
    });
    
    return Math.max(0, totalResources - viewedResources);
  } catch (error) {
    console.error(error);
    return 0;
  }
}
