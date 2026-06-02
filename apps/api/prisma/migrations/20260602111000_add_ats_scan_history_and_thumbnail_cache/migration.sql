-- AlterTable
ALTER TABLE "Cv" ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "thumbnailGeneratedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AtsScan" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "jobTitle" TEXT,
    "jobDescription" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "keywordScore" INTEGER,
    "formatScore" INTEGER,
    "completenessScore" INTEGER,
    "missingKeywords" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtsScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtsScan_cvId_createdAt_idx" ON "AtsScan"("cvId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AtsScan" ADD CONSTRAINT "AtsScan_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
