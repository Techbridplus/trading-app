import { Worker } from "bullmq";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

import { evaluateRisk } from "../../../packages/risk-engine/src/evaluateRisk";
import { getAccountState, saveAccountState } from "./stateStore";
import { createInitialState } from "./createInitialState";
import { isOutdatedEvent } from "./timestampGuard";
import { isDuplicateEvent } from "./idempotency";
import { persistMilestone } from "./persistence";
import { logger } from "./logger";
import { getAccountConfig } from "./accountRepository";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const url = new URL(redisUrl);
const redisPub = new Redis(redisUrl);

const prisma = new PrismaClient();

const worker = new Worker(
  "risk-events",
  async (job) => {
    const { accountId, event } = job.data;

    logger.info(
      { accountId, eventId: event.eventId },
      "Processing event"
    );

    let accountState = await getAccountState(accountId);

    if (!accountState) {
      logger.info({ accountId }, "Loading account config from DB");

      const config = await getAccountConfig(accountId);

      if (!config) {
        throw new Error(`Account config not found for ${accountId}`);
      }

      accountState = createInitialState(config, event.balance);
    }

    if (isOutdatedEvent(accountState, event)) {
      logger.warn(
        { accountId, eventId: event.eventId },
        "Outdated event ignored"
      );
      return;
    }

    const duplicate = await isDuplicateEvent(
      accountId,
      event.eventId
    );

    if (duplicate) {
      logger.warn(
        { accountId, eventId: event.eventId },
        "Duplicate event ignored"
      );
      return;
    }

    const previousStatus = accountState.status;

    const newState = evaluateRisk(accountState, event);

    const eventTime = new Date(event.timestamp).getTime();

    const finalState = {
      ...newState,
      lastProcessedAt: eventTime,
    };

    await saveAccountState(accountId, finalState);

    logger.info(
      { accountId, status: finalState.status },
      "State updated"
    );

    if (finalState.status !== previousStatus) {
      await persistMilestone(finalState, event.timestamp);
    }

    await redisPub.publish(
      "risk-updates",
      JSON.stringify({
        accountId,
        status: finalState.status,
        equity: finalState.currentEquity,
        balance: finalState.currentBalance,
        dailyBase: finalState.startOfDayBalance,
        initialBalance: finalState.initialBalance,
        dailyLimit: finalState.dailyLossPercent,
        totalLimit: finalState.totalLossPercent,
        timestamp: event.timestamp,
      })
    );
  },
  {
    connection: {
      host: url.hostname,
      port: parseInt(url.port || "6379", 10),
      maxRetriesPerRequest: null,
    },
    concurrency: 1,
  }
);

// ----------------------
// Worker Lifecycle Logs
// ----------------------

worker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Job completed");
});

worker.on("failed", (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      accountId: job?.data?.accountId,
      eventId: job?.data?.event?.eventId,
      err,
    },
    "Job permanently failed"
  );
});

worker.on("error", (err) => {
  logger.fatal({ err }, "Worker crashed");
});

logger.info("🚀 Risk Worker started...");

// ----------------------
// Graceful Shutdown
// ----------------------

async function shutdown() {
  try {
    logger.info("🛑 Graceful shutdown initiated...");

    await worker.pause(true);
    await worker.close();

    await redisPub.quit();
    await prisma.$disconnect();

    logger.info("✅ Shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.fatal({ err: error }, "Error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);