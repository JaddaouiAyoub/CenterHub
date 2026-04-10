"use server";

import prisma from "@/lib/prisma";
import { uploadToMega } from "@/lib/mega";
import { revalidatePath } from "next/cache";

export async function uploadResources(courseId: string, formData: FormData) {
  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    return { error: "Aucun fichier sélectionné" };
  }

  const results = [];
  const errors = [];

  try {
    console.log(`Starting upload for ${files.length} files. CourseID: ${courseId}`);
    
    for (const file of files) {
      if (!(file instanceof Blob)) {
        console.error("Item in formData is not a file/blob");
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name || "upload"}`;
        
        console.log(`Uploading ${fileName} to Mega... (${buffer.length} bytes)`);

        // Upload to Mega
        const megaUrl = await uploadToMega(fileName, buffer);
        console.log(`Mega upload successful: ${megaUrl}`);
        
        // Save to DB
        const resource = await (prisma as any).resource.create({
          data: {
            name: (file as any).name || "Unnamed file",
            url: megaUrl,
            type: getResourceType((file as any).type || ""),
            courseId: courseId
          }
        });
        
        console.log(`Database record created: ${resource.id}`);
        results.push(resource);
      } catch (err: any) {
        console.error(`Error processing file:`, err);
        errors.push(`${(file as any).name || "Un fichier"}: ${err.message}`);
      }
    }

    revalidatePath("/dashboard/schedule");

    if (results.length === 0) {
      return { error: `Échec complet: ${errors.join(", ") || "Aucune erreur spécifiée"}` };
    }

    return { 
      success: `${results.length} fichier(s) mis en ligne avec succès`,
      errors: errors.length > 0 ? errors : null
    };

  } catch (error: any) {
    console.error("Global upload error:", error);
    return { error: "Une erreur est survenue lors de l'upload: " + error.message };
  }
}


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
