import { localServiceDefaults } from "@worldweaver/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  WORKER_NAME: z.string().default(localServiceDefaults.workerName),
  WORKER_HEARTBEAT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(localServiceDefaults.workerHeartbeatMs),
  POSTGRES_URL: z.string().default(localServiceDefaults.postgresUrl),
  REDIS_URL: z.string().default(localServiceDefaults.redisUrl),
  QDRANT_URL: z.string().default(localServiceDefaults.qdrantUrl),
})

export const env = envSchema.parse(process.env)
