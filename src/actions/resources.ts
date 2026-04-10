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


function getResourceType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType === "application/pdf") return "PDF";
  return "OTHER";
}
