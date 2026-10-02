-- AlterTable
ALTER TABLE "KycCase" ADD COLUMN "pendingAction" TEXT;
ALTER TABLE "KycCase" ADD COLUMN "pendingById" TEXT;
ALTER TABLE "KycCase" ADD COLUMN "pendingByName" TEXT;
ALTER TABLE "KycCase" ADD COLUMN "pendingComment" TEXT;
ALTER TABLE "KycCase" ADD COLUMN "pendingFromStatus" TEXT;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "merchantRef" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "refundedAt" DATETIME,
    "refundedById" TEXT,
    "refundedByName" TEXT,
    "refundReason" TEXT
);

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_customerName_idx" ON "Transaction"("customerName");
