import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours

function getKey(accountId: string, eventId: string) {
  return `event:${accountId}:${eventId}`;
}

export async function isDuplicateEvent(
  accountId: string,
  eventId: string
): Promise<boolean> {

  const key = getKey(accountId, eventId);

  const setResult = await redis.set(
    key,
    "1",
    "EX",
    IDEMPOTENCY_TTL_SECONDS,
    "NX"
  );

  return setResult !== "OK";
}
