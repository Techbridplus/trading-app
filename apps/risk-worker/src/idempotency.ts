import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function isDuplicateEvent(
  accountId: string,
  eventId: string
): Promise<boolean> {
  const key = `event:${accountId}:${eventId}`;

  const exists = await redis.get(key);

  if (exists) {
    return true;
  }

  // Store eventId with TTL
  await redis.set(key, "1", "EX", IDEMPOTENCY_TTL_SECONDS);

  return false;
}
