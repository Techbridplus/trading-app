import { AccountState } from "../../../packages/shared-types/account";

interface AccountConfig {
  id: string;
  initialBalance: number;
  dailyLossPercent: number;
  totalLossPercent: number;
  timezone: string;
}

export function createInitialState(
  config: AccountConfig,
  currentBalance: number
): AccountState {

  const dailyLossLimitAmount =
    config.initialBalance * (config.dailyLossPercent / 100);

  const totalLossLimitAmount =
    config.initialBalance * (config.totalLossPercent / 100);

  return {
    accountId: config.id,

    initialBalance: config.initialBalance,
    startOfDayBalance: currentBalance,

    currentBalance,
    currentEquity: currentBalance,

    dailyLossPercent: config.dailyLossPercent,
    totalLossPercent: config.totalLossPercent,

    dailyLossLimitAmount,
    totalLossLimitAmount,

    status: "SAFE",

    timezone: config.timezone,

    lastDailyReset: new Date().toISOString().split("T")[0],
    lastProcessedAt: 0,
  };
}