import Redis from "ioredis";
import { logger } from "./logger";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { CommandReason, CommandType } from "../../../packages/shared-types/commands";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const prisma = new PrismaClient();

export async function publishCommandIfStatusChanged(
  previousStatus: string,
  newStatus: string,
  accountId: string
) {
  // Only publish if status actually changed
  if (previousStatus === newStatus) {
    return;
  }

  // Map status to command
  const commandMap: Record<string, { command: CommandType; reason: CommandReason }> = {
    "CAUTION_80": { command: "ALERT_ONLY", reason: "CAUTION_80" },
    "CRITICAL_95": { command: "DISABLE_TRADING", reason: "CRITICAL_95" },
    "LOCKED_DAILY": { command: "CLOSE_ALL", reason: "LOCKED_DAILY" },
    "LOCKED_PERMANENT": { command: "CLOSE_ALL", reason: "LOCKED_PERMANENT" },
  };

  const mapping = commandMap[newStatus];
  if (!mapping) {
    return; // SAFE status - no command needed
  }

  const commandId = crypto.randomUUID();

  try {
    await prisma.tradeCommand.create({
      data: {
        id: commandId,
        accountId,
        command: mapping.command,
        reason: mapping.reason,
      },
    });

    // Publish to Redis channel for bot to listen to
    await redis.publish(
      `commands:${accountId}`,
      JSON.stringify({
        commandId,
        accountId,
        command: mapping.command,
        reason: mapping.reason,
        timestamp: new Date().toISOString(),
      })
    );

    logger.info(
      { accountId, previousStatus, newStatus, command: mapping.command },
      "Command published due to status change"
    );
  } catch (error) {
    logger.error(
      { err: error, accountId, newStatus },
      "Failed to publish command"
    );
  }
}