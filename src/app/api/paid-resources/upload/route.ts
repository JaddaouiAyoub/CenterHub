import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadFileToDrive } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES =
  parseInt(process.env.PAID_RESOURCE_MAX_SIZE_MB ?? "500", 10) * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // ── Parse form data ──────────────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subjectName = (formData.get("subjectName") as string) || "General";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // ── MIME validation ──────────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé: ${file.type}` },
        { status: 400 }
      );
    }

    // ── Size validation ──────────────────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Fichier trop volumineux. Max ${process.env.PAID_RESOURCE_MAX_SIZE_MB ?? 500} MB`,
        },
        { status: 400 }
      );
    }

    // ── Buffer ───────────────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // ── Upload to Drive ──────────────────────────────────────────────────────
    const result = await uploadFileToDrive(fileName, buffer, file.type, subjectName);

    return NextResponse.json({
      driveFileId: result.fileId,
      mimeType: result.mimeType,
      size: result.size,
      name: result.name,
    });
  } catch (error: any) {
    console.error("[paid-resources/upload] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload: " + error.message },
      { status: 500 }
    );
  }
}
