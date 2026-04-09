import { getApiScaffoldCopy } from "@worldweaver/config"
import {
  chatSendRequestSchema,
  chatSendResponseSchema,
  commitWorldRequestSchema,
  commitWorldResponseSchema,
  createSessionRequestSchema,
  createSessionResponseSchema,
  draftGenerateRequestSchema,
  draftGenerateResponseSchema,
  draftRefineRequestSchema,
  draftRefineResponseSchema,
} from "@worldweaver/contracts"
import type { FastifyPluginAsync } from "fastify"
import { ApiRouteError } from "../lib/api-error.js"
import { getRequestLocale } from "../lib/locale.js"
import { failure, success } from "../lib/response.js"
import { mvpService } from "../lib/services.js"
import { parseBody } from "../lib/validation.js"

export const mvpRoutes: FastifyPluginAsync = async (app) => {
  app.post("/worlds/drafts/generate", async (request, reply) => {
    const locale = getRequestLocale(request)
    const copy = getApiScaffoldCopy(locale)
    const body = parseBody(
      draftGenerateRequestSchema,
      request.body,
      reply,
      request.id,
    )

    if (!body) {
      return
    }

    try {
      const data = draftGenerateResponseSchema.parse(
        await mvpService.generateDraft(body, locale),
      )

      return success(data, request.id, copy.envelopeMessages.scaffolded)
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

  app.post("/worlds/drafts/refine", async (request, reply) => {
    const locale = getRequestLocale(request)
    const copy = getApiScaffoldCopy(locale)
    const body = parseBody(
      draftRefineRequestSchema,
      request.body,
      reply,
      request.id,
    )

    if (!body) {
      return
    }

    try {
      const data = draftRefineResponseSchema.parse(
        await mvpService.refineDraft(body, locale),
      )

      return success(data, request.id, copy.envelopeMessages.scaffolded)
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

  app.post("/worlds/commit", async (request, reply) => {
    const locale = getRequestLocale(request)
    const copy = getApiScaffoldCopy(locale)
    const body = parseBody(
      commitWorldRequestSchema,
      request.body,
      reply,
      request.id,
    )

    if (!body) {
      return
    }

    try {
      const data = commitWorldResponseSchema.parse(
        await mvpService.commitWorld(body, locale),
      )

      return success(data, request.id, copy.envelopeMessages.queued)
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

  app.post("/sessions", async (request, reply) => {
    const locale = getRequestLocale(request)
    const copy = getApiScaffoldCopy(locale)
    const body = parseBody(
      createSessionRequestSchema,
      request.body,
      reply,
      request.id,
    )

    if (!body) {
      return
    }

    try {
      const data = createSessionResponseSchema.parse(
        await mvpService.createSession(body, locale),
      )

      return success(data, request.id, copy.envelopeMessages.created)
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

  app.post("/chat/send", async (request, reply) => {
    const locale = getRequestLocale(request)
    const copy = getApiScaffoldCopy(locale)
    const body = parseBody(
      chatSendRequestSchema,
      request.body,
      reply,
      request.id,
    )

    if (!body) {
      return
    }

    try {
      const data = chatSendResponseSchema.parse(
        await mvpService.sendChat(body, locale),
      )

      return success(data, request.id, copy.envelopeMessages.scaffolded)
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
