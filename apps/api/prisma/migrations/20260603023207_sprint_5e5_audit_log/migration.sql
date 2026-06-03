/*
  Warnings:

  - Added the required column `eventType` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('CV_CREATED', 'CV_UPDATED', 'CV_SECTION_UPDATED', 'CV_RESTORED', 'SHARE_LINK_CREATED', 'SHARE_LINK_DELETED', 'BILLING_STATUS_CHANGED', 'USER_ROLE_CHANGED');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "eventType" "AuditEventType" NOT NULL,
ADD COLUMN     "traceId" TEXT;
