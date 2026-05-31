-- AlterTable
ALTER TABLE "ClosureLog"
  ADD COLUMN "commandId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClosureLog_commandId_key" ON "ClosureLog"("commandId");

-- AddForeignKey
ALTER TABLE "ClosureLog" ADD CONSTRAINT "ClosureLog_commandId_fkey"
  FOREIGN KEY ("commandId") REFERENCES "TradeCommand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
