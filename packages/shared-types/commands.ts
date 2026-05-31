export type CommandType = "CLOSE_ALL" | "DISABLE_TRADING" | "ALERT_ONLY";

export type CommandReason = 
  | "CAUTION_80"
  | "CRITICAL_95"
  | "LOCKED_DAILY"
  | "LOCKED_PERMANENT";

export interface TradeCommand {
  commandId: string;           // unique ID
  accountId: string;
  command: CommandType;
  reason: CommandReason;
  timestamp: string;           // ISO timestamp
  executed: boolean;
  executedAt?: string;
}

export interface ClosureLog {
  closureId: string;
  accountId: string;
  reason: CommandReason;
  closedPositions: number;     // count of positions closed
  totalPnL: number;            // sum of P&L
  timestamp: string;
}