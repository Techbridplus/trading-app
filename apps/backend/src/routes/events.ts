import { Router } from "express";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/apiKeyAuth";
import { riskQueue } from "../queue/riskQueue";
import { logger } from "../logger";

const router = Router();

router.post("/events", apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  
  try {
    const { balance, equity, timestamp, eventId } = req.body;

    if (balance == null || equity == null || !timestamp || !eventId) {
      return res.status(400).json({ error: "Invalid event payload" });
    }

    await riskQueue.add(
      "process-event",
      {
        accountId: req.accountId,
        event: req.body,
      },
      {
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
      { accountId: req.accountId, eventId },
      "Event queued"
    );

    return res.status(200).json({ message: "Event queued" });

  } catch (error) {
    logger.error({ err: error }, "Failed to queue event");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;