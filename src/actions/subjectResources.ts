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
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.subjectResource.count({ where })
    ]);

    return {
      resources,
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
