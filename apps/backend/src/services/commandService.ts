import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import crypto from "crypto";
import { CommandReason, CommandType } from "../../../../packages/shared-types/commands";
import { logger } from "../logger";

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const COMMAND_RETENTION_DAYS = Number(process.env.COMMAND_RETENTION_DAYS || "30");
const CLOSURE_LOG_RETENTION_DAYS = Number(process.env.CLOSURE_LOG_RETENTION_DAYS || "180");

function getCutoffDate(days: number): Date {
  const now = Date.now();
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

/**
 * Maps account status to command & reason
 */
export function getCommandForStatus(status: string): { command: CommandType; reason: CommandReason } | null {
  const mapping: Record<string, { command: CommandType; reason: CommandReason }> = {
    "CAUTION_80": { command: "ALERT_ONLY", reason: "CAUTION_80" },
    "CRITICAL_95": { command: "DISABLE_TRADING", reason: "CRITICAL_95" },
    "LOCKED_DAILY": { command: "CLOSE_ALL", reason: "LOCKED_DAILY" },
    "LOCKED_PERMANENT": { command: "CLOSE_ALL", reason: "LOCKED_PERMANENT" },
  };
  
  return mapping[status] || null;
}

/**
 * Publishes command to Redis queue for bot to pick up
 */
export async function publishCommand(
  accountId: string,
  command: CommandType,
  reason: CommandReason
) {
  try {
    const pendingCommand = await prisma.tradeCommand.findFirst({
      where: {
        accountId,
        command,
        reason,
        executed: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (pendingCommand) {
      await redis.publish(
        `commands:${accountId}`,
        JSON.stringify({
          commandId: pendingCommand.id,
          accountId,
          command,
          reason,
          timestamp: pendingCommand.createdAt.toISOString(),
        })
      );

      logger.info(
        { accountId, command, reason, commandId: pendingCommand.id },
        "Pending command already exists; re-notified bot"
      );

      return pendingCommand.id;
    }

    const commandId = crypto.randomUUID();
    
    // Store in DB for audit
    await prisma.tradeCommand.create({
      data: {
        id: commandId,
        accountId,
        command,
        reason,
      },
    });

    // Publish to Redis for bot to subscribe to
    const commandData = {
      commandId,
      accountId,
      command,
      reason,
      timestamp: new Date().toISOString(),
    };

    await redis.publish(
      `commands:${accountId}`,
      JSON.stringify(commandData)
    );

    logger.info(
      { accountId, command, reason, commandId },
      "Command published"
    );

    return commandId;
  } catch (error) {
    logger.error({ err: error, accountId }, "Failed to publish command");
    throw error;
  }
}

/**
 * Mark command as executed by bot
 */
export async function markCommandExecuted(
  commandId: string,
  closedPositions: number,
  totalPnL: number
) {
  try {
    const command = await prisma.tradeCommand.findUnique({ where: { id: commandId } });

    if (!command) {
      throw new Error(`Command not found: ${commandId}`);
    }

    const executionResult = await prisma.tradeCommand.updateMany({
      where: {
        id: commandId,
        executed: false,
      },
      data: {
        executed: true,
        executedAt: new Date(),
      },
    });

    if (executionResult.count === 0) {
      logger.info({ commandId }, "Command already acknowledged; skipping duplicate closure log");
      return { alreadyExecuted: true };
    }

    await prisma.closureLog.create({
      data: {
        commandId,
        accountId: command.accountId,
        reason: command.reason,
        closedPositions,
        totalPnL,
      },
    });

    logger.info(
      { commandId, accountId: command.accountId, closedPositions, totalPnL },
      "Command executed & logged"
    );

    return { alreadyExecuted: false };
  } catch (error) {
    logger.error({ err: error, commandId }, "Failed to mark command executed");
    throw error;
  }
}

export async function purgeOldCommandData() {
  try {
    const commandCutoff = getCutoffDate(COMMAND_RETENTION_DAYS);
    const closureCutoff = getCutoffDate(CLOSURE_LOG_RETENTION_DAYS);

    const [deletedCommands, deletedClosures] = await Promise.all([
      prisma.tradeCommand.deleteMany({
        where: {
          executed: true,
          executedAt: {
            lt: commandCutoff,
          },
        },
      }),
      prisma.closureLog.deleteMany({
        where: {
          createdAt: {
            lt: closureCutoff,
          },
        },
      }),
    ]);

    logger.info(
      {
        deletedCommands: deletedCommands.count,
        deletedClosureLogs: deletedClosures.count,
        commandRetentionDays: COMMAND_RETENTION_DAYS,
        closureRetentionDays: CLOSURE_LOG_RETENTION_DAYS,
      },
      "Retention cleanup completed"
    );

    return {
      deletedCommands: deletedCommands.count,
      deletedClosureLogs: deletedClosures.count,
    };
  } catch (error) {
    logger.error({ err: error }, "Retention cleanup failed");
    throw error;
  }
}

// ✨ Export as object
export const commandService = {
  getCommandForStatus,
  publishCommand,
  markCommandExecuted,
  purgeOldCommandData,
};