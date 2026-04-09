import type { FastifyPluginAsync } from "fastify"
import { env } from "../lib/env.js"
import { success } from "../lib/response.js"

const startedAt = new Date().toISOString()

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async (request) =>
    success(
      {
        service: "api",
        status: "ready",
        started_at: startedAt,
        infrastructure: {
          postgres_url: env.POSTGRES_URL,
          redis_url: env.REDIS_URL,
          qdrant_url: env.QDRANT_URL,
        },
      },
      request.id,
    ),
  )
}
