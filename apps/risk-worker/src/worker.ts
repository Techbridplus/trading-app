import { Worker } from "bullmq";
import Redis from "ioredis";

import { evaluateRisk } from "../../../packages/risk-engine/src/evaluateRisk";
import { getAccountState, saveAccountState } from "./stateStore";
import { createInitialState } from "./createInitialState";
import { isOutdatedEvent } from "./timestampGuard";
import { isDuplicateEvent } from "./idempotency";
import { persistMilestone } from "./persistence";
import { logger } from "./logger";

const connection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const redisPub = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const worker = new Worker(
  "risk-events",
  async (job) => {
    try {
      const { accountId, event } = job.data;

      logger.info(
        { accountId, eventId: event.eventId, type: event.type },
        "Processing event"
      );

      let accountState = await getAccountState(accountId);

      if (!accountState) {
        logger.info({ accountId }, "Initializing account state");
        accountState = createInitialState(
          accountId,
          event.balance,
          "Asia/Kolkata"
        );
      }

      if (isOutdatedEvent(accountState, event)) {
        logger.warn(
          { accountId, eventId: event.eventId },
          "Outdated event ignored"
        );
        return;
      }

      const duplicate = await isDuplicateEvent(accountId, event.eventId);
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
        { accountId, eventId: event.eventId, status: finalState.status },
        "Risk state updated"
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
          timestamp: event.timestamp,
        })
      );
    } catch (error) {
      logger.error({ err: error }, "Worker error");
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    concurrency: 1,
  }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completed");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Job failed");
});

logger.info("Risk Worker started");
