-- CreateEnum
CREATE TYPE "AiRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "AiRequest" DROP COLUMN IF EXISTS "isReconciled",
ADD COLUMN     "status" "AiRequestStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "AiRequest_status_createdAt_idx" ON "AiRequest"("status", "createdAt");
