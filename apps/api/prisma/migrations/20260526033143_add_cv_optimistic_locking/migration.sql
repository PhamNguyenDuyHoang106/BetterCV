-- AlterTable
ALTER TABLE "Cv" ADD COLUMN     "lastEditedAt" TIMESTAMP(3),
ADD COLUMN     "lastEditedDevice" TEXT,
ADD COLUMN     "lastEditedSessionId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
