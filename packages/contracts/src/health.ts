import { z } from "zod"

export const healthInfrastructureSchema = z.object({
  postgres_url: z.string().min(1),
  redis_url: z.string().min(1),
  qdrant_url: z.string().min(1),
})

export const healthResponseSchema = z.object({
  service: z.literal("api"),
  status: z.literal("ready"),
  started_at: z.string().min(1),
  infrastructure: healthInfrastructureSchema,
})

export type HealthResponse = z.infer<typeof healthResponseSchema>
