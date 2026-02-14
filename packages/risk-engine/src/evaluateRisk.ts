import { AccountState } from "../../shared-types/account";
import { RiskEvent } from "../../shared-types/events";
import {
  calculateDailyDrawdown,
  calculateTotalDrawdown,
} from "./calculateDrawdown";
import { determineStatus } from "./stateMachine";
import { handleDailyReset } from "./handleDailyReset";

export function evaluateRisk(
  previousState: AccountState,
  event: RiskEvent
): AccountState {
  // Step 1: Handle daily reset
  const resetState = handleDailyReset(previousState, event);

  // 🔥 If permanently locked, never override
  if (resetState.status === "LOCKED_PERMANENT") {
    return {
      ...resetState,
      currentBalance: event.balance,
      currentEquity: event.equity,
    };
  }

  const updatedState: AccountState = {
    ...resetState,
    currentBalance: event.balance,
    currentEquity: event.equity,
  };

  const dailyDrawdown = calculateDailyDrawdown(
    updatedState.startOfDayBalance,
    updatedState.currentEquity
  );

  const totalDrawdown = calculateTotalDrawdown(
    updatedState.initialBalance,
    updatedState.currentEquity
  );

  const dailyUsageRatio =
    updatedState.dailyLossLimitAmount === 0
      ? 0
      : dailyDrawdown / updatedState.dailyLossLimitAmount;

  const totalUsageRatio =
    updatedState.totalLossLimitAmount === 0
      ? 0
      : totalDrawdown / updatedState.totalLossLimitAmount;

  const newStatus = determineStatus(dailyUsageRatio, totalUsageRatio);

  return {
    ...updatedState,
    status: newStatus,
  };
}
