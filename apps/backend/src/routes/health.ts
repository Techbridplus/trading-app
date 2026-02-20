import { Router } from "express";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

const router = Router();

const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const prisma = new PrismaClient();

/**
 * Liveness Check
 * Just confirms server is running
 */
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness Check
 * Confirms DB + Redis connectivity
 */
router.get("/ready", async (_req, res) => {
  try {
    // Check Redis
    await redis.ping();

    // Check DB
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed");

    res.status(500).json({
      status: "not_ready",
      error: "Dependency check failed",
    });
  }
});

export default router;