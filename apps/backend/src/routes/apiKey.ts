import { Router } from "express";
import { createApiKey } from "../services/apiKeyService";
import { logger } from "../logger";

const router = Router();

router.post("/api/keys", async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: "accountId required" });
    }

    const apiKey = await createApiKey(accountId);

    logger.info({ accountId }, "API key created");

    return res.status(201).json({ apiKey });
  } catch (error) {
    logger.error({ err: error }, "Failed to create API key");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;