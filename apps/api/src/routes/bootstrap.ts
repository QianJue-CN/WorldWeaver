import {
  getApiRouteCatalog,
  getApiScaffoldCopy,
  getBootstrapSummary,
  getWorkerJobCatalog,
} from "@worldweaver/config"
import {
  bootstrapCatalogQuerySchema,
  bootstrapCatalogResponseSchema,
} from "@worldweaver/contracts"
import type { FastifyPluginAsync } from "fastify"
import { getRequestLocale } from "../lib/locale.js"
import { success } from "../lib/response.js"
import { providerRegistry } from "../lib/services.js"
import { parseQuery } from "../lib/validation.js"

export const bootstrapRoutes: FastifyPluginAsync = async (app) => {
  app.get("/bootstrap", async (request, reply) => {
    const query = parseQuery(
      bootstrapCatalogQuerySchema,
      request.query,
      reply,
      request.id,
    )

    if (!query) {
      return
    }

    const locale = getRequestLocale(request, query.locale)
    const copy = getApiScaffoldCopy(locale)
    const data = bootstrapCatalogResponseSchema.parse({
      ...getBootstrapSummary(locale),
      api_routes: getApiRouteCatalog(locale),
      provider_configs: providerRegistry.listSystemProviderDescriptors(locale),
      worker_jobs: getWorkerJobCatalog(locale),
    })

    return success(data, request.id, copy.envelopeMessages.ok)
  })
}
