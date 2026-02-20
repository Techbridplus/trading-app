import pino from "pino";

let transport;
if (process.env.NODE_ENV !== "production") {
  try {
    require.resolve("pino-pretty");
    transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
      },
    };
  } catch (e) {
    console.warn("⚠️  pino-pretty not found, using default output");
    transport = undefined;
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport,
});

