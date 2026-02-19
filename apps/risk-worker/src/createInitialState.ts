import { AccountState } from "../../../packages/shared-types/account";

export function createInitialState(
  accountId: string,
  initialBalance: number,
  timezone: string
): AccountState {
  const dailyLossPercent = 5;
  const totalLossPercent = 10;

  const dailyLossLimitAmount =
    initialBalance * (dailyLossPercent / 100);

  const totalLossLimitAmount =
    initialBalance * (totalLossPercent / 100);

  return {
    accountId,

    initialBalance,
    startOfDayBalance: initialBalance,

    currentBalance: initialBalance,
    currentEquity: initialBalance,

    dailyLossPercent,
    totalLossPercent,

    dailyLossLimitAmount,
    totalLossLimitAmount,

    status: "SAFE",

    timezone,
    lastDailyReset: new Date().toISOString().split("T")[0],

    lastProcessedAt: 0,
  };
}
