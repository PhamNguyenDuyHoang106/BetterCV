-- AlterEnum
-- Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block in some PG versions, but is fully supported in migration files.
ALTER TYPE "AiRequestStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "AiRequest" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AiRequest_idempotencyKey_key" ON "AiRequest"("idempotencyKey");
