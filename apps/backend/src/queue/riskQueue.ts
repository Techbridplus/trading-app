import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const url = new URL(redisUrl);

const connection = {
  host: url.hostname,
  port: parseInt(url.port || "6379", 10),
  maxRetriesPerRequest: null,
};

export const riskQueue = new Queue("risk-events", {
  connection,
});