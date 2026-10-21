import "server-only";

import { NextResponse } from "next/server";
import { streamFileFromDrive } from "@/lib/google-drive";

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

export function extractDriveFileId(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!["drive.google.com", "docs.google.com"].includes(parsed.hostname.toLowerCase())) return null;
    return parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? parsed.searchParams.get("id");
  } catch {
    return null;
  }
}

export async function streamPublicDriveFile(
  request: Request,
  driveFileId: string,
  fallbackMimeType: string,
  logTag: string,
) {
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
    console.warn(`${logTag} Public Drive fetch failed:`, error);
  }

  const publicMimeType = driveResponse?.headers.get("Content-Type") || "";
  if (driveResponse?.ok && !publicMimeType.toLowerCase().startsWith("text/html")) {
    const contentType = publicMimeType && !publicMimeType.startsWith("application/octet-stream")
      ? publicMimeType
      : fallbackMimeType;
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
    const headers = createStreamHeaders(mimeType || fallbackMimeType, size);
    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    console.warn(`${logTag} Drive API failed:`, error);
  }

  return NextResponse.json({ error: "Impossible de lire le fichier Google Drive" }, { status: 502 });
}

export function createStreamHeaders(contentType: string, size: number, sourceHeaders?: Headers) {
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
