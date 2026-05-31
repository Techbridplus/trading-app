-- AlterTable
ALTER TABLE "ApiKey"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "lastUsedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ApiKey_accountId_revokedAt_idx" ON "ApiKey"("accountId", "revokedAt");

-- CreateIndex
CREATE INDEX "TradeCommand_accountId_executed_createdAt_idx" ON "TradeCommand"("accountId", "executed", "createdAt");

-- CreateIndex
CREATE INDEX "ClosureLog_accountId_createdAt_idx" ON "ClosureLog"("accountId", "createdAt");
