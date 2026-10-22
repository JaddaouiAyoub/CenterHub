CREATE TYPE "PaidFormationExamSubmissionStatus" AS ENUM ('PENDING', 'GRADED');

ALTER TABLE "PaidFormationFolder" ADD COLUMN "isExam" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "PaidFormationExamSubmission" (
    
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submissionUrl" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "status" "PaidFormationExamSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "grade" DOUBLE PRECISION,
    "remarks" TEXT,
    "gradedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    CONSTRAINT "PaidFormationExamSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaidFormationExamSubmission_studentId_idx" ON "PaidFormationExamSubmission"("studentId");
CREATE INDEX "PaidFormationExamSubmission_status_idx" ON "PaidFormationExamSubmission"("status");
CREATE UNIQUE INDEX "PaidFormationExamSubmission_folderId_studentId_key" ON "PaidFormationExamSubmission"("folderId", "studentId");

ALTER TABLE "PaidFormationExamSubmission" ADD CONSTRAINT "PaidFormationExamSubmission_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "PaidFormationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaidFormationExamSubmission" ADD CONSTRAINT "PaidFormationExamSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaidFormationExamSubmission" ADD CONSTRAINT "PaidFormationExamSubmission_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
