import {
  localServiceDefaults,
  providerRuntimeDefaults,
} from "@worldweaver/config"
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
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  OPENAI_BASE_URL: z.string().default(providerRuntimeDefaults.openAiBaseUrl),
  OPENAI_TEXT_MODEL: z
    .string()
    .default(providerRuntimeDefaults.openAiTextModel),
  OPENAI_EMBEDDING_MODEL: z
    .string()
    .default(providerRuntimeDefaults.openAiEmbeddingModel),
  OPENAI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(providerRuntimeDefaults.openAiTimeoutMs),
  OPENAI_ORGANIZATION: z.string().trim().min(1).optional(),
  OPENAI_PROJECT: z.string().trim().min(1).optional(),
  OPENAI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().optional(),
  MOCK_EMBEDDING_DIMENSIONS: z.coerce
    .number()
    .int()
    .positive()
    .default(providerRuntimeDefaults.mockEmbeddingDimensions),
})

export type ApiEnv = z.infer<typeof envSchema>
export const env = envSchema.parse(process.env)
export const allowedOrigins = env.API_ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
