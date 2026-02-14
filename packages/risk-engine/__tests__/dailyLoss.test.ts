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

describe("Daily Loss Risk Tests", () => {
  test("should remain SAFE when daily loss < 80%", () => {
    const state = createBaseState();
    const event = createEvent(97000); // 3000 loss

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("SAFE");
  });

  test("should enter CAUTION_80 at 80% usage", () => {
    const state = createBaseState();
    const event = createEvent(96000); // 4000 loss (80%)

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("CAUTION_80");
  });

  test("should enter CRITICAL_95 at 95% usage", () => {
    const state = createBaseState();
    const event = createEvent(95250); // 4750 loss (95%)

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("CRITICAL_95");
  });

  test("should LOCK when daily loss >= limit", () => {
    const state = createBaseState();
    const event = createEvent(95000); // 5000 loss (100%)

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("LOCKED_DAILY");
  });

  test("should LOCK when floating loss exceeds limit", () => {
    const state = createBaseState();
    const event = createEvent(94800); // 5200 loss

    const result = evaluateRisk(state, event);

    expect(result.status).toBe("LOCKED_DAILY");
  });
});
