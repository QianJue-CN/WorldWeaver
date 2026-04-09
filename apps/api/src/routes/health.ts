import { getApiScaffoldCopy } from "@worldweaver/config"
import { healthResponseSchema } from "@worldweaver/contracts"
import type { FastifyPluginAsync } from "fastify"
import { env } from "../lib/env.js"
import { getRequestLocale } from "../lib/locale.js"
import { success } from "../lib/response.js"

const startedAt = new Date().toISOString()

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async (request) => {
    const locale = getRequestLocale(request)
    const copy = getApiScaffoldCopy(locale)
    const data = healthResponseSchema.parse({
      service: "api",
      status: "ready",
      started_at: startedAt,
      infrastructure: {
        postgres_url: env.POSTGRES_URL,
        redis_url: env.REDIS_URL,
        qdrant_url: env.QDRANT_URL,
      },
    })

    return success(data, request.id, copy.envelopeMessages.ok)
  })
}
