import { Router } from "express";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/apiKeyAuth";
import { riskQueue } from "../queue/riskQueue";

const router = Router();

router.post("/events", apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  const { type, balance, equity, timestamp, eventId } = req.body ?? {};

  if (!type || balance == null || equity == null || !timestamp || !eventId) {
    return res.status(400).json({ error: "Invalid event payload" });
  }

  await riskQueue.add("process-event", {
    accountId: req.accountId,
    event: req.body,
  });

  return res.status(200).json({ message: "Event queued" });
});

export default router;
