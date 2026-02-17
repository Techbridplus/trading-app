import { Router } from "express";
import { generateApiKey } from "../utils/generateApiKey";
import { hashApiKey } from "../utils/hash";
import { saveApiKey } from "../db/mockDb";

const router = Router();

router.post("/api/keys", (req, res) => {
  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: "accountId is required" });
  }

  const { prefix, secret, fullKey } = generateApiKey();

  const hashedSecret = hashApiKey(secret);

  saveApiKey({
    accountId,
    apiKeyPrefix: prefix,
    apiKeyHash: hashedSecret,
    revoked: false,
  });

  return res.status(201).json({
    apiKey: fullKey, // show only once
    message: "Save this key securely. It will not be shown again.",
  });
});

export default router;
