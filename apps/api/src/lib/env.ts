import { localServiceDefaults } from "@worldweaver/config"
import { loadLocalRuntimeEnv } from "@worldweaver/config/runtime-env"
import { z } from "zod"

loadLocalRuntimeEnv(import.meta.url)

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_HOST: z.string().default(localServiceDefaults.apiHost),
  API_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(localServiceDefaults.apiPort),
  API_ALLOWED_ORIGINS: z
    .string()
    .default(localServiceDefaults.apiAllowedOrigins),
  POSTGRES_URL: z.string().default(localServiceDefaults.postgresUrl),
  REDIS_URL: z.string().default(localServiceDefaults.redisUrl),
  QDRANT_URL: z.string().default(localServiceDefaults.qdrantUrl),
})

export const env = envSchema.parse(process.env)
export const allowedOrigins = env.API_ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
