import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { streamFileFromDrive } from "@/lib/google-drive";
import { getPaidFormationResourceStreamData, verifyStudentFormationPurchase } from "@/lib/paid-formations";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
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

    if (resource.driveFileId) {
      try {
        const { stream, mimeType, size } = await streamFileFromDrive(resource.driveFileId);
        const body = new ReadableStream({
          start(controller) {
            stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
            stream.on("end", () => controller.close());
            stream.on("error", (error: Error) => controller.error(error));
          },
        });
        const headers = createStreamHeaders(mimeType || resource.mimeType, size);
        return new NextResponse(body, { status: 200, headers });
      } catch (error) {
        console.warn("[paid-formations/stream] Drive API failed:", error);
      }

      const driveUrl = `https://drive.google.com/uc?export=download&id=${resource.driveFileId}`;
      const driveResponse = await fetch(driveUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (driveResponse.ok) {
        const contentType = resource.mimeType || driveResponse.headers.get("Content-Type") || "application/octet-stream";
        const headers = createStreamHeaders(contentType, Number(driveResponse.headers.get("Content-Length")) || 0);
        return new NextResponse(driveResponse.body, { status: 200, headers });
      }
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

function createStreamHeaders(contentType: string, size: number) {
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": 'inline; filename="formation-resource"',
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store, no-cache",
    "Content-Security-Policy": "frame-ancestors 'self'",
  });
  if (size > 0) headers.set("Content-Length", String(size));
  return headers;
}
