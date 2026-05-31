import { Router } from "express";
import crypto from "crypto";
import { createApiKey } from "../services/apiKeyService";
import { logger } from "../logger";

const router = Router();

router.post("/api/keys", async (req, res) => {
  try {
    const configuredAdminKey = process.env.ADMIN_API_KEY;

    if (!configuredAdminKey) {
      logger.error("ADMIN_API_KEY is not configured");
      return res.status(503).json({ error: "Admin key configuration missing" });
    }

    const incomingAdminKey = req.header("x-admin-key");

    if (!incomingAdminKey) {
      return res.status(401).json({ error: "Missing admin key" });
    }

    const incomingBuffer = Buffer.from(incomingAdminKey, "utf8");
    const configuredBuffer = Buffer.from(configuredAdminKey, "utf8");

    if (
      incomingBuffer.length !== configuredBuffer.length ||
      !crypto.timingSafeEqual(incomingBuffer, configuredBuffer)
    ) {
      return res.status(403).json({ error: "Invalid admin key" });
    }

    const { accountId } = req.body;

    if (typeof accountId !== "string" || accountId.trim().length === 0) {
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