import {
  apiRouteCatalog,
  bootstrapSummary,
  workerJobCatalog,
} from "@worldweaver/config"
import type { FastifyPluginAsync } from "fastify"
import { success } from "../lib/response.js"

export const bootstrapRoutes: FastifyPluginAsync = async (app) => {
  app.get("/bootstrap", async (request) =>
    success(
      {
        ...bootstrapSummary,
        api_routes: apiRouteCatalog,
        worker_jobs: workerJobCatalog,
      },
      request.id,
    ),
  )
}
