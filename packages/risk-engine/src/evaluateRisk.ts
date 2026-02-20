import { AccountState } from "../../shared-types/account";
import { RiskEvent } from "../../shared-types/events";
import {
  calculateDailyDrawdown,
  calculateTotalDrawdown,
} from "./calculateDrawdown";
import { determineStatus } from "./stateMachine";
import { handleDailyReset } from "./handleDailyReset";

/**
 * Evaluates risk for an account based on a new event.
 * Handles daily resets, calculates drawdowns, and determines account status.
 */
export function evaluateRisk(
  previousState: AccountState,
  event: RiskEvent
): AccountState {
  // Step 1: Handle daily reset (resets limits if new trading day)
  const resetState = handleDailyReset(previousState, event);

  // Step 2: If permanently locked, remain locked (immutable terminal state)
  if (resetState.status === "LOCKED_PERMANENT") {
    return {
      ...resetState,
      currentBalance: event.balance,
      currentEquity: event.equity,
    };
  }

  // Step 3: Update state with current event data
  const updatedState: AccountState = {
    ...resetState,
    currentBalance: event.balance,
    currentEquity: event.equity,
  };

  // Step 4: Calculate drawdowns
  const dailyDrawdown = calculateDailyDrawdown(
    updatedState.startOfDayBalance,
    updatedState.currentEquity
  );

  const totalDrawdown = calculateTotalDrawdown(
    updatedState.initialBalance,
    updatedState.currentEquity
  );

  // Step 5: Calculate usage ratios (handle zero limits)
  const dailyUsageRatio =
    updatedState.dailyLossLimitAmount > 0
      ? dailyDrawdown / updatedState.dailyLossLimitAmount
      : 0;

  const totalUsageRatio =
    updatedState.totalLossLimitAmount > 0
      ? totalDrawdown / updatedState.totalLossLimitAmount
      : 0;

  // Step 6: Determine new status based on usage ratios
  const newStatus = determineStatus(dailyUsageRatio, totalUsageRatio);

  // Step 7: Preserve LOCKED_DAILY state for the remainder of trading day
  // Once locked daily, it stays locked until next trading day resets it
  // (Only exception: transition to LOCKED_PERMANENT if breached)
  if (previousState.status === "LOCKED_DAILY" && newStatus !== "LOCKED_PERMANENT") {
    return {
      ...updatedState,
      status: "LOCKED_DAILY",
    };
  }

  return {
    ...updatedState,
    status: newStatus,
  };
}