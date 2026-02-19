import { Request, Response, NextFunction } from "express";
import { findByPrefix } from "../db/mockDb";
import { hashApiKey } from "../utils/hash";
import { logger } from "../logger";

export interface AuthenticatedRequest extends Request {
  accountId?: string;
}

export function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    logger.warn(
      { path: req.path, ip: req.ip },
      "Missing API key on authenticated route"
    );
    return res.status(401).json({ error: "API key required" });
  }

  const parts = apiKey.split(".");

  if (parts.length !== 2) {
    logger.warn({ path: req.path, ip: req.ip }, "Invalid API key format");
    return res.status(401).json({ error: "Invalid API key format" });
  }

  const [prefix, secret] = parts;

  const record = findByPrefix(prefix);

  if (!record) {
    logger.warn(
      { path: req.path, ip: req.ip, apiKeyPrefix: prefix },
      "API key prefix not found"
    );
    return res.status(401).json({ error: "Invalid API key" });
  }

  const hashedSecret = hashApiKey(secret);

  if (hashedSecret !== record.apiKeyHash) {
    logger.warn(
      { path: req.path, ip: req.ip, apiKeyPrefix: prefix },
      "API key secret mismatch"
    );
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Attach accountId to request
  req.accountId = record.accountId;
  logger.info(
    { path: req.path, accountId: record.accountId },
    "API key authentication successful"
  );

  next();
}
