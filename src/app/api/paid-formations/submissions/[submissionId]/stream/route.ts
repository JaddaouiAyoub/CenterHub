import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { streamPublicDriveFile } from "@/lib/paid-formation-stream";
import { canReadExamSubmission, getPaidFormationExamSubmission } from "@/lib/paid-formations";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { submissionId } = await params;
    const submission = await getPaidFormationExamSubmission(submissionId);
    if (!submission) return NextResponse.json({ error: "Copie introuvable" }, { status: 404 });
    if (!await canReadExamSubmission(session.user, submission)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return streamPublicDriveFile(request, submission.driveFileId, submission.mimeType, "[paid-formations/submissions]");
  } catch (error) {
    console.error("[paid-formations/submissions] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la lecture" }, { status: 500 });
  }
}
