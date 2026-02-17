import { RiskEvent } from "../../../packages/shared-types/events";
import { evaluateRisk } from "../../../packages/risk-engine/src/evaluateRisk";
import { isDuplicateEvent } from "./idempotency";
import { isOutdatedEvent } from "./timestampGuard";
import { AccountState } from "../../../packages/shared-types/account";

export async function processEvent(
  accountState: AccountState,
  event: RiskEvent
): Promise<AccountState> {

  // 1️⃣ Idempotency check
  const duplicate = await isDuplicateEvent(event.accountId, event.eventId);
  if (duplicate) {
    return accountState;
  }

  // 2️⃣ Timestamp guard
  if (isOutdatedEvent(accountState, event)) {
    return accountState;
  }

  // 3️⃣ Evaluate risk
  const newState = evaluateRisk(accountState, event);

  // 4️⃣ Update lastProcessedAt
  const eventTime = new Date(event.timestamp).getTime();

  return {
    ...newState,
    lastProcessedAt: eventTime,
  };
}
