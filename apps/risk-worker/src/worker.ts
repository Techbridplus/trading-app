import { Worker } from "bullmq";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const url = new URL(redisUrl);
const connection = {
  host: url.hostname,
  port: parseInt(url.port || "6379", 10),
  maxRetriesPerRequest: null,
};

const worker = new Worker(
  "risk-events",
  async (job) => {
    const { accountId, event } = job.data;

    console.log("Processing event for:", accountId);
    console.log(event);

    // TODO:
    // 1. Load account state from Redis/DB
    // 2. Run evaluateRisk()
    // 3. Save updated state
    // 4. Persist if milestone
  },
  {
    connection,
    concurrency: 1, // IMPORTANT for now
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
