export type RiskEventType =
  | "TRADE_OPEN"
  | "TRADE_CLOSE"
  | "BALANCE_UPDATE"
  | "EQUITY_UPDATE";

export interface RiskEvent {
  eventId: string;           // unique id from EA
  accountId: string;

  type: RiskEventType;

  balance: number;           // full account balance snapshot
  equity: number;            // full equity snapshot

  timestamp: string;         // ISO UTC string
}
