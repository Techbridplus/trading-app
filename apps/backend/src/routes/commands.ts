import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/apiKeyAuth";
import { commandService } from "../services/commandService";
import { logger } from "../logger";

const prisma = new PrismaClient();
const router = Router();

/**
 * Bot polls this endpoint to get pending commands
 * GET /commands/pending
 */
router.get("/commands/pending", apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const accountId = req.accountId;

    if (!accountId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get oldest unexecuted command for deterministic processing
    const command = await prisma.tradeCommand.findFirst({
      where: {
        accountId,
        executed: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!command) {
      return res.status(200).json({ command: null });
    }

    return res.status(200).json({
      commandId: command.id,
      command: command.command,
      reason: command.reason,
      timestamp: command.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch pending command");
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Bot sends this after executing command
 * POST /commands/acknowledge
 */
router.post("/commands/acknowledge", apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { commandId, closedPositions, totalPnL } = req.body;
    const accountId = req.accountId;

    if (!accountId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
      typeof commandId !== "string" ||
      typeof closedPositions !== "number" ||
      !Number.isFinite(closedPositions) ||
      closedPositions < 0 ||
      (totalPnL != null && (typeof totalPnL !== "number" || !Number.isFinite(totalPnL)))
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify command belongs to this account
    const command = await prisma.tradeCommand.findUnique({
      where: { id: commandId },
    });

    if (!command || command.accountId !== accountId) {
      return res.status(404).json({ error: "Command not found" });
    }

    // Update command & log closure
    await commandService.markCommandExecuted(
      commandId,
      closedPositions,
      totalPnL || 0
    );

    logger.info(
      { accountId, commandId, closedPositions },
      "Command acknowledged"
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Failed to acknowledge command");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;