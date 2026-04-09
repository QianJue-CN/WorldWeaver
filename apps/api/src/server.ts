import cors from "@fastify/cors"
import Fastify from "fastify"
import { allowedOrigins, env } from "./lib/env.js"
import { bootstrapRoutes } from "./routes/bootstrap.js"
import { healthRoutes } from "./routes/health.js"
import { mvpRoutes } from "./routes/mvp.js"

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "development" ? "info" : "warn",
  },
})

void app.register(cors, {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
})

void app.register(healthRoutes, { prefix: "/api" })
void app.register(bootstrapRoutes, { prefix: "/api" })
void app.register(mvpRoutes, { prefix: "/api" })

async function start() {
  try {
    await app.listen({ host: env.API_HOST, port: env.API_PORT })
    app.log.info(
      `WorldWeaver API listening on http://${env.API_HOST}:${env.API_PORT}`,
    )
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

void start()
