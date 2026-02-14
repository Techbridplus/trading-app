export type AccountStatus =
  | "SAFE"
  | "CAUTION_80"
  | "CRITICAL_95"
  | "LOCKED_DAILY"
  | "LOCKED_PERMANENT";

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

  status: AccountStatus;

  timezone: string;

  lastDailyReset: string; // ISO Date (YYYY-MM-DD)
}
