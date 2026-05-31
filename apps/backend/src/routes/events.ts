import { Router } from "express";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/apiKeyAuth";
import { riskQueue } from "../queue/riskQueue";
import { logger } from "../logger";

const router = Router();

router.post("/events", apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  
  try {
    const { balance, equity, timestamp, eventId } = req.body;
    const accountId = req.accountId;

    if (!accountId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsedTimestamp = new Date(timestamp);

    if (
      typeof eventId !== "string" ||
      typeof balance !== "number" ||
      !Number.isFinite(balance) ||
      typeof equity !== "number" ||
      !Number.isFinite(equity) ||
      typeof timestamp !== "string" ||
      Number.isNaN(parsedTimestamp.getTime())
    ) {
      return res.status(400).json({ error: "Invalid event payload" });
    }

    await riskQueue.add(
      "process-event",
      {
        accountId,
        event: req.body,
      },
      {
        jobId: `${accountId}:${eventId}`,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    logger.info(
      { accountId, eventId },
      "Event queued"
    );

    return res.status(200).json({ message: "Event queued" });

  } catch (error) {
    logger.error({ err: error }, "Failed to queue event");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;