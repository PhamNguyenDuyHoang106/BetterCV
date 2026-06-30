-- CreateEnum
CREATE TYPE "CareerCoachRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- Update old lowercase message role strings if any exist
UPDATE "CareerCoachMessage" SET "role" = UPPER("role");

-- AlterTable
ALTER TABLE "CareerCoachSession" ADD COLUMN "messageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CareerCoachSession" ADD COLUMN "lastMessageAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CareerCoachMessage" ALTER COLUMN "role" TYPE "CareerCoachRole" USING ("role"::"CareerCoachRole");

-- CreateIndex
CREATE INDEX "CareerCoachSession_lastMessageAt_idx" ON "CareerCoachSession"("lastMessageAt");
