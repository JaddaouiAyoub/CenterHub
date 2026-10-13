import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { streamFileFromDrive } from "@/lib/google-drive";
import { getPaidFormationResourceStreamData, verifyStudentFormationPurchase } from "@/lib/paid-formations";

export const dynamic = "force-dynamic";
const MAX_RANGE_BYTES = 1024 * 1024;

function limitRange(range: string | null) {
  const match = range?.match(/^bytes=(\d+)-(\d*)$/i);
  if (!match) return range;

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : Number.POSITIVE_INFINITY;
  if (!Number.isSafeInteger(start) || requestedEnd < start) return range;

  const end = Math.min(requestedEnd, start + MAX_RANGE_BYTES - 1);
  return `bytes=${start}-${end}`;
}

function extractDriveFileId(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!["drive.google.com", "docs.google.com"].includes(parsed.hostname.toLowerCase())) return null;
    return parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? parsed.searchParams.get("id");
  } catch {
    return null;
  }
}

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
      const range = limitRange(request.headers.get("range"));
      let driveResponse: Response | null = null;
      try {
        const rangeHeaders: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
        if (range) rangeHeaders.Range = range;
        driveResponse = await fetch(
          `https://drive.usercontent.google.com/download?id=${encodeURIComponent(driveFileId)}&export=download&confirm=t`,
          { headers: rangeHeaders },
        );
      } catch (error) {
        console.warn("[paid-formations/stream] Public Drive fetch failed:", error);
      }

      const publicMimeType = driveResponse?.headers.get("Content-Type") || "";
      if (driveResponse?.ok && !publicMimeType.toLowerCase().startsWith("text/html")) {
        const contentType = publicMimeType && !publicMimeType.startsWith("application/octet-stream")
          ? publicMimeType
          : resource.mimeType;
        const headers = createStreamHeaders(
          contentType,
          Number(driveResponse.headers.get("Content-Length")) || 0,
          driveResponse.headers,
        );
        return new NextResponse(driveResponse.body, { status: driveResponse.status, headers });
      }
      await driveResponse?.body?.cancel().catch(() => undefined);

      try {
        const { stream, mimeType, size } = await streamFileFromDrive(driveFileId);
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

      return NextResponse.json({ error: "Impossible de lire le fichier Google Drive" }, { status: 502 });
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

function createStreamHeaders(contentType: string, size: number, sourceHeaders?: Headers) {
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": 'inline; filename="formation-resource"',
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=300",
    "Vary": "Cookie",
    "Content-Security-Policy": "frame-ancestors 'self'",
  });
  const contentLength = sourceHeaders?.get("Content-Length");
  if (contentLength) headers.set("Content-Length", contentLength);
  else if (size > 0) headers.set("Content-Length", String(size));
  const contentRange = sourceHeaders?.get("Content-Range");
  if (contentRange) headers.set("Content-Range", contentRange);
  headers.set("Accept-Ranges", sourceHeaders?.get("Accept-Ranges") || "bytes");
  return headers;
}
