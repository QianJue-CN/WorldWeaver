import {
  deleteProviderConfigParamsSchema,
  deleteProviderConfigResponseSchema,
  providerConfigListQuerySchema,
  providerConfigListResponseSchema,
  savedProviderConfigSchema,
  upsertProviderConfigRequestSchema,
} from "@worldweaver/contracts"
import type { FastifyPluginAsync } from "fastify"
import { ApiRouteError } from "../lib/api-error.js"
import { getRequestLocale } from "../lib/locale.js"
import { failure, success } from "../lib/response.js"
import { providerConfigService } from "../lib/services.js"
import { parseBody, parseParams, parseQuery } from "../lib/validation.js"

export const providerConfigRoutes: FastifyPluginAsync = async (app) => {
  app.get("/provider-configs", async (request, reply) => {
    const query = parseQuery(
      providerConfigListQuerySchema,
      request.query,
      reply,
      request.id,
    )

    if (!query) {
      return
    }

    const locale = getRequestLocale(request)
    try {
      const data = providerConfigListResponseSchema.parse(
        await providerConfigService.listConfigs(query.owner_id, locale),
      )

      return success(data, request.id, "ok")
    } catch (error) {
      if (error instanceof ApiRouteError) {
        return reply
          .status(error.statusCode)
          .send(
            failure(error.statusCode, error.code, request.id, error.details),
          )
      }

      throw error
    }
  })

  app.post("/provider-configs", async (request, reply) => {
    const body = parseBody(
      upsertProviderConfigRequestSchema,
      request.body,
      reply,
      request.id,
    )

    if (!body) {
      return
    }

    const locale = getRequestLocale(request)
    try {
      const data = savedProviderConfigSchema.parse(
        await providerConfigService.upsertConfig(body, locale),
      )

      return success(data, request.id, "saved")
    } catch (error) {
      if (error instanceof ApiRouteError) {
        return reply
          .status(error.statusCode)
          .send(
            failure(error.statusCode, error.code, request.id, error.details),
          )
      }

      throw error
    }
  })

  app.delete("/provider-configs/:providerConfigId", async (request, reply) => {
    const params = parseParams(
      deleteProviderConfigParamsSchema,
      request.params,
      reply,
      request.id,
    )
    const query = parseQuery(
      providerConfigListQuerySchema,
      request.query,
      reply,
      request.id,
    )

    if (!params || !query) {
      return
    }

    try {
      const data = deleteProviderConfigResponseSchema.parse(
        await providerConfigService.deleteConfig(
          query.owner_id,
          params.providerConfigId,
        ),
      )

      return success(data, request.id, "deleted")
    } catch (error) {
      if (error instanceof ApiRouteError) {
        return reply
          .status(error.statusCode)
          .send(
            failure(error.statusCode, error.code, request.id, error.details),
          )
      }

      throw error
    }
  })
}
