import Redis from "ioredis";
import { AccountState } from "../../../packages/shared-types/account";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function getKey(accountId: string) {
  return `account:${accountId}`;
}

export async function getAccountState(
  accountId: string
): Promise<AccountState | null> {
  const data = await redis.get(getKey(accountId));

  if (!data) return null;

  return JSON.parse(data);
}

export async function saveAccountState(
  accountId: string,
  state: AccountState
): Promise<void> {
  await redis.set(getKey(accountId), JSON.stringify(state));
}
