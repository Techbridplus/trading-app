import express from "express";
import http from "http";
import { Server } from "socket.io";
import apiKeyRoutes from "./routes/apiKey";
import eventRoutes from "./routes/events";
import healthRoutes from "./routes/health";
import accountRoutes from "./routes/accounts";
import commandRoutes from "./routes/commands";
import Redis from "ioredis";
import { logger } from "./logger";
import { getAccountIdFromApiKey } from "./middleware/apiKeyAuth";
import { commandService } from "./services/commandService";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(apiKeyRoutes);
app.use(eventRoutes);
app.use(healthRoutes);
app.use(accountRoutes);
app.use(commandRoutes);
// Redis subscriber for worker events
const redisSub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redisSub.subscribe("risk-updates");

redisSub.on("message", (channel, message) => {
  if (channel === "risk-updates") {
    try {
      const data = JSON.parse(message);
      const { accountId } = data;

      if (typeof accountId === "string" && accountId.length > 0) {
        io.to(accountId).emit("risk-update", data);
      }
    } catch (error) {
      logger.warn({ err: error }, "Invalid risk-update payload received from Redis");
    }
  }
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Client connected");

  socket.on("join-account", async (payload: { accountId?: string; apiKey?: string }) => {
    try {
      const accountId = payload?.accountId;
      const apiKey = payload?.apiKey;

      if (!accountId || !apiKey) {
        socket.emit("error", "Missing accountId or apiKey");
        return;
      }

      const authenticatedAccountId = await getAccountIdFromApiKey(apiKey);

      if (!authenticatedAccountId || authenticatedAccountId !== accountId) {
        socket.emit("error", "Unauthorized room join");
        return;
      }

      socket.join(accountId);
      logger.info(
        { socketId: socket.id, accountId },
        "Socket joined account room"
      );
    } catch (error) {
      logger.warn({ err: error, socketId: socket.id }, "Socket join-account failed");
      socket.emit("error", "Join account failed");
    }
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Client disconnected");
  });
});

const PORT = 4001;
const RETENTION_SWEEP_INTERVAL_MINUTES = Number(
  process.env.RETENTION_SWEEP_INTERVAL_MINUTES || "60"
);

let retentionSweepTimer: NodeJS.Timeout | undefined;

if (RETENTION_SWEEP_INTERVAL_MINUTES > 0) {
  retentionSweepTimer = setInterval(async () => {
    try {
      await commandService.purgeOldCommandData();
    } catch (error) {
      logger.error({ err: error }, "Periodic retention cleanup failed");
    }
  }, RETENTION_SWEEP_INTERVAL_MINUTES * 60 * 1000);

  retentionSweepTimer.unref();
}

server.listen(PORT, () => {
  logger.info({ port: PORT }, `Backend running on http://localhost:${PORT}`);
});


async function shutdown() {
  logger.info("🛑 Backend shutting down...");

  if (retentionSweepTimer) {
    clearInterval(retentionSweepTimer);
  }

  server.close(() => {
    logger.info("HTTP server closed");
  });

  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
