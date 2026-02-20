import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

const prisma = new PrismaClient();
const router = Router();

router.post("/accounts", async (req, res) => {
  try {
    const {
      initialBalance,
      dailyLossPercent,
      totalLossPercent,
      timezone,
    } = req.body;

    if (
      initialBalance == null ||
      dailyLossPercent == null ||
      totalLossPercent == null ||
      !timezone
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const account = await prisma.account.create({
      data: {
        id: `acc_${Date.now()}`,
        initialBalance,
        dailyLossPercent,
        totalLossPercent,
        timezone,
      },
    });

    logger.info({ accountId: account.id }, "Account created");

    return res.status(201).json(account);
  } catch (error) {
    logger.error({ err: error }, "Failed to create account");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;