import { AccountState } from "../../shared-types/account";
import { RiskEvent } from "../../shared-types/events";

function getDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
  }).format(date); // YYYY-MM-DD format
}

export function handleDailyReset(
  previousState: AccountState,
  event: RiskEvent
): AccountState {
  const eventDate = getDateInTimezone(
    new Date(event.timestamp),
    previousState.timezone
  );

  if (eventDate === previousState.lastDailyReset) {
    return previousState;
  }

  // New day detected

  // Do not reset if permanently locked
  if (previousState.status === "LOCKED_PERMANENT") {
    return previousState;
  }

  const newStartOfDayBalance = event.equity;

  const newDailyLimit =
    newStartOfDayBalance * (previousState.dailyLossPercent / 100);

  return {
    ...previousState,
    startOfDayBalance: newStartOfDayBalance,
    dailyLossLimitAmount: newDailyLimit,
    lastDailyReset: eventDate,
    status:
      previousState.status === "LOCKED_DAILY"
        ? "SAFE"
        : previousState.status,
  };
}
