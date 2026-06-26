import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { z } from "zod";

/**
 * Locate the monorepo root .env
 *
 * packages/config/src
 *        ↑
 *        ../../..
 *        ↓
 * repo/.env
 */

const possibleEnvFiles = [
  path.resolve(__dirname, "../../../.env"), // monorepo root
  path.resolve(__dirname, "../../../.env.local"),
  path.resolve(__dirname, "../../../apps/api/.env"),
  path.resolve(__dirname, "../../../apps/api/.env.local"),
];

for (const envFile of possibleEnvFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    console.log(`✅ Loaded environment: ${envFile}`);
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  APP_PORT: z.coerce.number().default(4000),

  APP_URL: z.string().url().default("http://localhost:3000"),

  API_URL: z.string().url().default("http://localhost:4000"),

  JWT_SECRET: z.string().min(32),

  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  DATABASE_URL: z.string().min(1),

  REDIS_HOST: z.string().default("localhost"),

  REDIS_PORT: z.coerce.number().default(6379),

  REDIS_PASSWORD: z.string().default(""),

  GOOGLE_CLIENT_ID: z.string().default(""),

  GOOGLE_CLIENT_SECRET: z.string().default(""),

  GOOGLE_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/auth/google/callback"),

  YOUTUBE_API_KEY: z.string().default(""),

  TOKEN_ENCRYPTION_KEY: z.string().min(16),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("\n❌ Environment validation failed\n");

    console.error(parsed.error.format());

    process.exit(1);
  }

  return parsed.data;
}

export const env = Object.freeze(loadEnv());

export default env;