import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { streamFileFromDrive } from "@/lib/google-drive";
import { verifyStudentPurchase, getResourceStreamData } from "@/actions/paidResources";

export const dynamic = "force-dynamic";

function extractDriveId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;

    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const resourceData = await getResourceStreamData(resourceId);
    if (!resourceData) {
      return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
    }

    const role = session.user.role;
    const isAdmin = ["ADMIN", "TEACHER", "SECRETARY"].includes(role);

    // ── RBAC Logic ────────────────────────────────────────────────────────────
    if (role === "STUDENT") {
      // Students can only see PUBLISHED resources
      if (resourceData.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Ressource non disponible" }, { status: 403 });
      }
      
      const studentId = session.user.id;
      if (!studentId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      
      const hasPurchased = await verifyStudentPurchase(studentId, resourceId);
      if (!hasPurchased) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    } else if (!isAdmin) {
      // Any other role that is not an admin/teacher/secretary is denied
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    // Admins fall through to stream regardless of status

    let driveId = resourceData.driveFileId;
    if (!driveId && resourceData.source === "URL" && resourceData.externalUrl) {
      driveId = extractDriveId(resourceData.externalUrl);
    }

    // ── Attempt 1: Google Drive API (for private or high-limit files) ──────────
    if (driveId) {
      try {
        const { stream, mimeType, size } = await streamFileFromDrive(driveId);
        const webStream = new ReadableStream({
          start(controller) {
            stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
            stream.on("end", () => controller.close());
            stream.on("error", (err: Error) => controller.error(err));
          },
        });

        const headers = new Headers();
        headers.set("Content-Type", mimeType);
        headers.set("Content-Disposition", 'inline; filename="resource.pdf"');
        if (size > 0) headers.set("Content-Length", String(size));
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Cache-Control", "private, no-store, no-cache");
        headers.set("Content-Security-Policy", "frame-ancestors 'self'");
        return new NextResponse(webStream, { status: 200, headers });
      } catch (driveErr: any) {
        // If API fails (e.g. invalid_client), we proceed to Attempt 2 (Public fetch)
        console.warn("[stream] Drive API failed, falling back to public fetch:", driveErr.message);
      }
    }

    // ── Attempt 2: Public Download Fetch ─────────────────────────────────────
    if (driveId) {
      const publicUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
      const upstreamRes = await fetch(publicUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });

      if (upstreamRes.ok) {
        const headers = new Headers();
        // Priority: Database mimeType (if specific) > Upstream mimeType
        const finalMimeType = (resourceData.mimeType && resourceData.mimeType !== "application/octet-stream")
          ? resourceData.mimeType
          : (upstreamRes.headers.get("Content-Type") || "application/octet-stream");

        headers.set("Content-Type", finalMimeType);
        headers.set("Content-Disposition", 'inline; filename="resource.pdf"');
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Content-Security-Policy", "frame-ancestors 'self'");
        return new NextResponse(upstreamRes.body, { status: 200, headers });
      }
    }

    // ── Attempt 3: General URL Proxy ──────────────────────────────────────────
    if (resourceData.source === "URL" && resourceData.externalUrl) {
      const upstreamRes = await fetch(resourceData.externalUrl, {
        headers: { "User-Agent": "CenterHub/1.0" },
      });
      if (!upstreamRes.ok) return NextResponse.json({ error: "Erreur source" }, { status: 502 });

      const headers = new Headers();
      headers.set("Content-Type", resourceData.mimeType || upstreamRes.headers.get("Content-Type") || "application/octet-stream");
      headers.set("Content-Disposition", 'inline; filename="resource.pdf"');
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Content-Security-Policy", "frame-ancestors 'self'");
      return new NextResponse(upstreamRes.body, { status: 200, headers });
    }

    return NextResponse.json({ error: "Aucune source valide" }, { status: 400 });
  } catch (error: any) {
    console.error("[stream] Global Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
