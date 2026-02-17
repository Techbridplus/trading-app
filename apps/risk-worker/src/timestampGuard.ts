import { AccountState } from "../../../packages/shared-types/account";
import { RiskEvent } from "../../../packages/shared-types/events";

export function isOutdatedEvent(
  accountState: AccountState,
  event: RiskEvent
): boolean {
  const eventTime = new Date(event.timestamp).getTime();

  return eventTime <= accountState.lastProcessedAt;
}
