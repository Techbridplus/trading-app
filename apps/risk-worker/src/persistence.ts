import { PrismaClient } from "../../../generated/prisma/client";
import { AccountState } from "../../../packages/shared-types/account";
import { logger } from "./logger";

const prisma = new PrismaClient({} as any);

export async function persistMilestone(
  accountState: AccountState,
  timestamp: string
) {
  await prisma.riskSnapshot.create({
    data: {
      accountId: accountState.accountId,
      status: accountState.status,
      balance: accountState.currentBalance,
      equity: accountState.currentEquity,
      timestamp: new Date(timestamp),
    },
  });

  logger.info(
    { accountId: accountState.accountId, status: accountState.status },
    "Milestone persisted to DB"
  );
}
