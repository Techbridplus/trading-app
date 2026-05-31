-- CreateTable
CREATE TABLE "TradeCommand" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosureLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "closedPositions" INTEGER NOT NULL,
    "totalPnL" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClosureLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TradeCommand" ADD CONSTRAINT "TradeCommand_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosureLog" ADD CONSTRAINT "ClosureLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
