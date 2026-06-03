-- CreateTable
CREATE TABLE "PayosTransaction" (
    "orderCode" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayosTransaction_pkey" PRIMARY KEY ("orderCode")
);
