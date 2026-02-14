import { evaluateRisk } from "../src/evaluateRisk";
import { AccountState } from "../../shared-types/account";
import { RiskEvent } from "../../shared-types/events";

function createBaseState(): AccountState {
  return {
    accountId: "acc-1",

    initialBalance: 100000,
    startOfDayBalance: 100000,

    currentBalance: 100000,
    currentEquity: 95000,

    dailyLossPercent: 5,
    totalLossPercent: 10,

    dailyLossLimitAmount: 5000,
    totalLossLimitAmount: 10000,

    status: "LOCKED_DAILY",

    timezone: "Asia/Kolkata",
    lastDailyReset: "2026-02-14",
  };
}

describe("Daily Reset Logic", () => {
  test("should reset daily lock on new day", () => {
    const state = createBaseState();

    const event: RiskEvent = {
      eventId: "event-1",
      accountId: "acc-1",
      type: "EQUITY_UPDATE",
      balance: 95000,
      equity: 95000,
      timestamp: "2026-02-15T01:00:00.000Z", // Next day
    };

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("SAFE");
    expect(result.startOfDayBalance).toBe(95000);
  });

  test("should NOT reset permanent lock", () => {
    const state = {
      ...createBaseState(),
      status: "LOCKED_PERMANENT" as const,
    };

    const event: RiskEvent = {
      eventId: "event-2",
      accountId: "acc-1",
      type: "EQUITY_UPDATE",
      balance: 95000,
      equity: 95000,
      timestamp: "2026-02-15T01:00:00.000Z",
    };

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("LOCKED_PERMANENT");
  });
});
