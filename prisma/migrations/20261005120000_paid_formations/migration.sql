CREATE TYPE "PaidFormationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "PaidFormationResourceType" AS ENUM ('PDF', 'IMAGE', 'VIDEO');
CREATE TYPE "PaidFormationResourceSource" AS ENUM ('DRIVE', 'URL');
CREATE TYPE "PaidFormationResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "PaidFormationPurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED');

CREATE TABLE "PaidFormation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "status" "PaidFormationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaidFormation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaidFormationFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaidFormationFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaidFormationResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "PaidFormationResourceType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "source" "PaidFormationResourceSource" NOT NULL DEFAULT 'DRIVE',
    "driveFileId" TEXT,
    "externalUrl" TEXT,
    "status" "PaidFormationResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaidFormationResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaidFormationPurchase" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "status" "PaidFormationPurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaidFormationPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaidFormationFolder_id_formationId_key" ON "PaidFormationFolder"("id", "formationId");
CREATE UNIQUE INDEX "PaidFormationFolder_formationId_parentId_name_key" ON "PaidFormationFolder"("formationId", "parentId", "name");
CREATE UNIQUE INDEX "PaidFormationPurchase_formationId_studentId_key" ON "PaidFormationPurchase"("formationId", "studentId");
CREATE INDEX "PaidFormation_status_idx" ON "PaidFormation"("status");
CREATE INDEX "PaidFormation_name_idx" ON "PaidFormation"("name");
CREATE INDEX "PaidFormation_createdAt_idx" ON "PaidFormation"("createdAt");
CREATE INDEX "PaidFormationFolder_formationId_idx" ON "PaidFormationFolder"("formationId");
CREATE INDEX "PaidFormationFolder_parentId_idx" ON "PaidFormationFolder"("parentId");
CREATE INDEX "PaidFormationResource_folderId_idx" ON "PaidFormationResource"("folderId");
CREATE INDEX "PaidFormationResource_status_idx" ON "PaidFormationResource"("status");
CREATE INDEX "PaidFormationResource_type_idx" ON "PaidFormationResource"("type");
CREATE INDEX "PaidFormationPurchase_studentId_idx" ON "PaidFormationPurchase"("studentId");
CREATE INDEX "PaidFormationPurchase_formationId_idx" ON "PaidFormationPurchase"("formationId");
CREATE INDEX "PaidFormationPurchase_purchasedAt_idx" ON "PaidFormationPurchase"("purchasedAt");
CREATE INDEX "PaidFormationPurchase_status_idx" ON "PaidFormationPurchase"("status");
CREATE INDEX "PaidFormationPurchase_method_idx" ON "PaidFormationPurchase"("method");

ALTER TABLE "PaidFormationFolder"
    ADD CONSTRAINT "PaidFormationFolder_formationId_fkey"
    FOREIGN KEY ("formationId") REFERENCES "PaidFormation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaidFormationFolder"
    ADD CONSTRAINT "PaidFormationFolder_parentId_formationId_fkey"
    FOREIGN KEY ("parentId", "formationId") REFERENCES "PaidFormationFolder"("id", "formationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaidFormationResource"
    ADD CONSTRAINT "PaidFormationResource_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "PaidFormationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaidFormationPurchase"
    ADD CONSTRAINT "PaidFormationPurchase_formationId_fkey"
    FOREIGN KEY ("formationId") REFERENCES "PaidFormation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaidFormationPurchase"
    ADD CONSTRAINT "PaidFormationPurchase_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
