import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { File as MegaFile } from "megajs";
import { getMegaStorage } from "@/lib/mega";

// Helper to convert Node.js ReadableStream to Web ReadableStream
function nodeStreamToWebStream(nodeStream: any): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      nodeStream.on("data", (chunk: any) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      nodeStream.on("end", () => {
        controller.close();
      });
      nodeStream.on("error", (err: any) => {
        controller.error(err);
      });
    },
    cancel() {
      if (nodeStream.destroy) nodeStream.destroy();
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // id here is the notificationId
) {
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || !notification.attachmentUrl) {
      return new NextResponse("Fichier de notification non trouvé", { status: 404 });
    }

    await getMegaStorage(); 
    
    const file = MegaFile.fromURL(notification.attachmentUrl);
    await file.loadAttributes();

    const nodeStream = (file as any).download();
    const webStream = nodeStreamToWebStream(nodeStream);

    const contentType = getMimeType(notification.attachmentType || "OTHER", notification.attachmentName || "file");

    return new Response(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${notification.attachmentName}"`,
        "Content-Length": (file.size || 0).toString(),
      },
    });
  } catch (error) {
    console.error("Notification File Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function getMimeType(type: string, fileName: string): string {
  if (type === "PDF") return "application/pdf";
  if (type === "IMAGE") {
    if (fileName.endsWith(".png")) return "image/png";
    if (fileName.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  }
  if (type === "VIDEO") return "video/mp4";
  return "application/octet-stream";
}
