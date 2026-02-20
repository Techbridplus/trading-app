import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateRandomString(length: number) {
  return crypto.randomBytes(length).toString("hex");
}

export async function createApiKey(accountId: string) {
  // Ensure account exists
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  const prefix = `rk_live_${generateRandomString(4)}`;
  const secret = generateRandomString(16);

  const hashedSecret = crypto
    .createHash("sha256")
    .update(secret)
    .digest("hex");

  await prisma.apiKey.create({
    data: {
      accountId,
      prefix,
      hashedSecret,
    },
  });

  return `${prefix}.${secret}`;
}