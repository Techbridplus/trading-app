import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  accountId?: string;
}

export async function getAccountIdFromApiKey(apiKey?: string): Promise<string | null> {
  if (!apiKey) {
    return null;
  }

  const [prefix, secret] = apiKey.split(".");

  if (!prefix || !secret) {
    return null;
  }

  const keyRecord = await prisma.apiKey.findUnique({
    where: { prefix },
  });

  if (!keyRecord) {
    return null;
  }

  const hashedSecret = crypto
    .createHash("sha256")
    .update(secret)
    .digest("hex");

  const hashedBuffer = Buffer.from(hashedSecret, "utf8");
  const storedBuffer = Buffer.from(keyRecord.hashedSecret, "utf8");

  if (hashedBuffer.length !== storedBuffer.length) {
    return null;
  }

  const valid = crypto.timingSafeEqual(hashedBuffer, storedBuffer);

  if (!valid) {
    return null;
  }

  return keyRecord.accountId;
}

export async function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const accountId = await getAccountIdFromApiKey(req.header("x-api-key"));

    if (!accountId) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.accountId = accountId;
    next();
  } catch (_error) {
    return res.status(500).json({ error: "Auth service unavailable" });
  }
}