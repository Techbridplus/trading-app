import { Request, Response, NextFunction } from "express";
import { findByPrefix } from "../db/mockDb";
import { hashApiKey } from "../utils/hash";

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
    return res.status(401).json({ error: "API key required" });
  }

  const parts = apiKey.split(".");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Invalid API key format" });
  }

  const [prefix, secret] = parts;

  const record = findByPrefix(prefix);

  if (!record) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  const hashedSecret = hashApiKey(secret);

  if (hashedSecret !== record.apiKeyHash) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Attach accountId to request
  req.accountId = record.accountId;

  next();
}
