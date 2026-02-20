import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAccountConfig(accountId: string) {
  return prisma.account.findUnique({
    where: { id: accountId },
  });
}