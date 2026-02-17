export interface AccountState {
  accountId: string;

  initialBalance: number;
  startOfDayBalance: number;

  currentBalance: number;
  currentEquity: number;

  dailyLossPercent: number;
  totalLossPercent: number;

  dailyLossLimitAmount: number;
  totalLossLimitAmount: number;

  status:
    | "SAFE"
    | "CAUTION_80"
    | "CRITICAL_95"
    | "LOCKED_DAILY"
    | "LOCKED_PERMANENT";

  timezone: string;

  lastDailyReset: string;

  lastProcessedAt: number; // ← NEW (epoch ms)
}
