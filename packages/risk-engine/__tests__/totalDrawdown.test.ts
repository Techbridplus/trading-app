import { evaluateRisk } from "../src/evaluateRisk";
import { AccountState } from "../../shared-types/account";
import { RiskEvent } from "../../shared-types/events";

function createBaseState(): AccountState {
  return {
    accountId: "acc-1",

    initialBalance: 100000,
    startOfDayBalance: 100000,

    currentBalance: 100000,
    currentEquity: 100000,

    dailyLossPercent: 5,
    totalLossPercent: 10,

    dailyLossLimitAmount: 5000,
    totalLossLimitAmount: 10000,

    status: "SAFE",

    timezone: "Asia/Kolkata",
    lastDailyReset: "2026-02-14",
  };
}

function createEvent(equity: number): RiskEvent {
  return {
    eventId: crypto.randomUUID(),
    accountId: "acc-1",
    type: "EQUITY_UPDATE",
    balance: equity,
    equity,
    timestamp: new Date().toISOString(),
  };
}

describe("Total Drawdown Risk Tests", () => {
  test("should remain SAFE when total drawdown < limit", () => {
    const state = createBaseState();
    // Use lower startOfDayBalance so daily drawdown stays under daily limit (5000)
    // while total drawdown (6000) stays under total limit (10000)
    state.startOfDayBalance = 96000;
    const event = createEvent(94000); // total drawdown: 6000, daily drawdown: 2000

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("SAFE");
  });

  test("should LOCK_PERMANENT when total drawdown exceeds limit", () => {
    const state = createBaseState();
    const event = createEvent(89000); // 11000 drawdown

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("LOCKED_PERMANENT");
  });
});
