import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  accountId?: string;
}

export async function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  const [prefix, secret] = apiKey.split(".");

  if (!prefix || !secret) {
    return res.status(401).json({ error: "Invalid API key format" });
  }

  const keyRecord = await prisma.apiKey.findUnique({
    where: { prefix },
  });

  if (!keyRecord) {
    return res.status(401).json({ error: "API key not found" });
  }

  const hashedSecret = crypto
    .createHash("sha256")
    .update(secret)
    .digest("hex");

  if (hashedSecret !== keyRecord.hashedSecret) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  req.accountId = keyRecord.accountId;

  next();
}