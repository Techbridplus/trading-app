import { AccountState } from "../../../packages/shared-types/account";
import { RiskEvent } from "../../../packages/shared-types/events";

export function isOutdatedEvent(
  accountState: AccountState,
  event: RiskEvent
): boolean {
  const eventTime = new Date(event.timestamp).getTime();
  
  if (isNaN(eventTime)) {
    throw new Error("Invalid event timestamp");
  }

  return eventTime <= accountState.lastProcessedAt;
}
