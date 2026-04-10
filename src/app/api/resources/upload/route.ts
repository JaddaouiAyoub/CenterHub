import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadToMega } from "@/lib/mega";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const courseId = formData.get("courseId") as string;
    const files = formData.getAll("files") as File[];

    if (!courseId) {
      return NextResponse.json({ error: "courseId est requis" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier sélectionné" }, { status: 400 });
    }

    const results = [];
    const errors = [];

    console.log(`API Upload: Starting for ${files.length} files. CourseID: ${courseId}`);

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name || "upload"}`;

        console.log(`API Upload: ${fileName} to Mega... (${buffer.length} bytes)`);

        // Upload to Mega
        const megaUrl = await uploadToMega(fileName, buffer);
        console.log(`API Upload: Mega success: ${megaUrl}`);

        // Save to DB
        const resource = await (prisma as any).resource.create({
          data: {
            name: file.name || "Unnamed file",
            url: megaUrl,
            type: getResourceType(file.type || ""),
            courseId: courseId,
          },
        });

        console.log(`API Upload: DB record: ${resource.id}`);
        results.push(resource);
      } catch (err: any) {
        console.error(`API Upload: File error:`, err);
        errors.push(`${file.name || "Un fichier"}: ${err.message}`);
      }
    }

    revalidatePath("/dashboard/schedule");

    if (results.length === 0) {
      return NextResponse.json({ 
        error: `Échec complet: ${errors.join(", ") || "Erreur inconnue"}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: `${results.length} fichier(s) mis en ligne avec succès`,
      errors: errors.length > 0 ? errors : null,
      results
    });

  } catch (error: any) {
    console.error("API Upload Global error:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors de l'upload: " + error.message 
    }, { status: 500 });
  }
}

function getResourceType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType === "application/pdf") return "PDF";
  return "OTHER";
}
