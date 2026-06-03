-- CreateEnum
CREATE TYPE "OcrJobStatus" AS ENUM ('UPLOADED', 'QUEUED', 'PROCESSING', 'REVIEWING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'CRON', 'WORKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ThumbnailStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "AiRequest" ADD COLUMN     "estimatedTokens" INTEGER;

-- AlterTable
ALTER TABLE "AtsScan" ADD COLUMN     "jobDescriptionHash" TEXT,
ADD COLUMN     "recommendations" JSONB,
ALTER COLUMN "jobDescription" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Cv" ADD COLUMN     "atsScannedAt" TIMESTAMP(3),
ADD COLUMN     "atsVersion" TEXT,
ADD COLUMN     "thumbnailStatus" "ThumbnailStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "OcrJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "OcrJobStatus" NOT NULL DEFAULT 'UPLOADED',
    "extractedCvId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OcrJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "severity" "AuditSeverity" NOT NULL,
    "requestId" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OcrJob_userId_idx" ON "OcrJob"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Cv_updatedAt_thumbnailGeneratedAt_idx" ON "Cv"("updatedAt", "thumbnailGeneratedAt");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrJob" ADD CONSTRAINT "OcrJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
