-- CreateTable
CREATE TABLE "CareerCoachSession" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'General Career Coaching',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerCoachSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerCoachMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerCoachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerCoachSession_roadmapId_idx" ON "CareerCoachSession"("roadmapId");

-- CreateIndex
CREATE INDEX "CareerCoachSession_userId_idx" ON "CareerCoachSession"("userId");

-- CreateIndex
CREATE INDEX "CareerCoachSession_roadmapId_archived_idx" ON "CareerCoachSession"("roadmapId", "archived");

-- CreateIndex
CREATE INDEX "CareerCoachMessage_sessionId_idx" ON "CareerCoachMessage"("sessionId");

-- CreateIndex
CREATE INDEX "CareerCoachMessage_sessionId_createdAt_idx" ON "CareerCoachMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "CareerCoachSession" ADD CONSTRAINT "CareerCoachSession_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerCoachSession" ADD CONSTRAINT "CareerCoachSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerCoachMessage" ADD CONSTRAINT "CareerCoachMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CareerCoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
