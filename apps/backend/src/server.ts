import express from "express";
import http from "http";
import { Server } from "socket.io";
import apiKeyRoutes from "./routes/apiKey";
import eventRoutes from "./routes/events";
import Redis from "ioredis";
import { logger } from "./logger";

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

// Redis subscriber for worker events
const redisSub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redisSub.subscribe("risk-updates");

redisSub.on("message", (channel, message) => {
  if (channel === "risk-updates") {
    const data = JSON.parse(message);

    const { accountId } = data;

    // Emit only to that account room
    io.to(accountId).emit("risk-update", data);
  }
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Client connected");

  socket.on("join-account", (accountId: string) => {
    socket.join(accountId);
    logger.info(
      { socketId: socket.id, accountId },
      "Socket joined account room"
    );
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Client disconnected");
  });
});

const PORT = 4001;

server.listen(PORT, () => {
  logger.info({ port: PORT }, `Backend running on http://localhost:${PORT}`);
});
