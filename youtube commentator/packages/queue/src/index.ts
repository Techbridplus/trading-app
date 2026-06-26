import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// ── Redis Connection ──
export function createRedisConnection(
  host: string = 'localhost',
  port: number = 6379,
  password?: string
): IORedis {
  return new IORedis({
    host,
    port,
    password: password || undefined,
    maxRetriesPerRequest: null,
  });
}

// ── Queue Names ──
export const QUEUE_NAMES = {
  SYNC: 'sync-queue',
  OPERATION: 'operation-queue',
  NOTIFICATION: 'notification-queue',
  ANALYTICS: 'analytics-queue',
  MAINTENANCE: 'maintenance-queue',
} as const;

// ── Queue Factory ──
export function createQueue(name: string, connection: ConnectionOptions): Queue {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });
}

// ── Queue Initialization ──
export function initializeQueues(connection: ConnectionOptions) {
  return {
    syncQueue: createQueue(QUEUE_NAMES.SYNC, connection),
    operationQueue: createQueue(QUEUE_NAMES.OPERATION, connection),
    notificationQueue: createQueue(QUEUE_NAMES.NOTIFICATION, connection),
    analyticsQueue: createQueue(QUEUE_NAMES.ANALYTICS, connection),
    maintenanceQueue: createQueue(QUEUE_NAMES.MAINTENANCE, connection),
  };
}

export { Queue, Worker };
export type { ConnectionOptions };
