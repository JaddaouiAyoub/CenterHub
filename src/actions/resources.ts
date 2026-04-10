"use server";

import prisma from "@/lib/prisma";
import { uploadToMega } from "@/lib/mega";
import { revalidatePath } from "next/cache";




export async function getCourseResources(courseId: string) {
  try {
    const resources = await (prisma as any).resource.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" }
    });
    return { resources };
  } catch (error) {
    return { error: "Erreur lors de la récupération des supports" };
  }
}

export async function deleteResource(id: string) {
  try {
    await (prisma as any).resource.delete({
      where: { id }
    });
    revalidatePath("/dashboard/schedule");
    return { success: "Fichier supprimé" };
  } catch (error) {
    return { error: "Échec de la suppression" };
  }
}

export async function getStudentResources(studentId: string) {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        classes: {
          include: {
            courses: {
              include: {
                resources: true,
                subject: true,
                teacher: { include: { user: true } }
              }
            }
          }
        }
      }
    });

    if (!student) return { resources: [] };

    const resources: any[] = [];
    student.classes.forEach(cl => {
      cl.courses.forEach(c => {
        c.resources.forEach(r => {
          resources.push({
            ...r,
            courseName: c.name,
            subjectName: c.subject?.name,
            teacherName: c.teacher?.user?.name
          });
        });
      });
    });

    return { resources: resources.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch student resources" };
  }
}


function getResourceType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType === "application/pdf") return "PDF";
  return "OTHER";
}
