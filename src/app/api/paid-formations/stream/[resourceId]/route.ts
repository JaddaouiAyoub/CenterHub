import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createStreamHeaders, extractDriveFileId, streamPublicDriveFile } from "@/lib/paid-formation-stream";
import { getPaidFormationResourceStreamData, verifyStudentFormationPurchase } from "@/lib/paid-formations";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { resourceId } = await params;
    const resource = await getPaidFormationResourceStreamData(resourceId);
    if (!resource) return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });

    const manager = ["ADMIN", "TEACHER", "SECRETARY"].includes(session.user.role);
    if (session.user.role === "STUDENT") {
      if (resource.status !== "PUBLISHED" || resource.folder.formation.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Ressource non disponible" }, { status: 403 });
      }
      if (!session.user.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      const hasAccess = await verifyStudentFormationPurchase(
        session.user.id,
        resource.folder.formationId,
      );
      if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    } else if (!manager) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const driveFileId = resource.driveFileId || (resource.source === "URL" ? extractDriveFileId(resource.externalUrl) : null);
    if (driveFileId) {
      return streamPublicDriveFile(request, driveFileId, resource.mimeType, "[paid-formations/stream]");
    }

    if (resource.source === "URL" && resource.externalUrl) {
      const externalUrl = new URL(resource.externalUrl);
      if (!["http:", "https:"].includes(externalUrl.protocol)) {
        return NextResponse.json({ error: "URL de ressource invalide" }, { status: 400 });
      }
      const upstream = await fetch(externalUrl, { headers: { "User-Agent": "CenterHub/1.0" } });
      if (!upstream.ok) return NextResponse.json({ error: "Erreur lors de la lecture de la source" }, { status: 502 });
      const contentType = resource.mimeType || upstream.headers.get("Content-Type") || "application/octet-stream";
      const headers = createStreamHeaders(contentType, Number(upstream.headers.get("Content-Length")) || 0);
      return new NextResponse(upstream.body, { status: 200, headers });
    }

    return NextResponse.json({ error: "Aucune source valide" }, { status: 400 });
  } catch (error) {
    console.error("[paid-formations/stream] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la lecture" }, { status: 500 });
  }
}
