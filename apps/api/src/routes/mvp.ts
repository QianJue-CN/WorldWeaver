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
import { getRequestLocale } from "../lib/locale.js"
import { success } from "../lib/response.js"
import { parseBody } from "../lib/validation.js"

function slugify(value: string) {
  const normalized = value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "_")
    .replace(/^_+|_+$/g, "")

  return normalized || crypto.randomUUID().slice(0, 8)
}

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

    const data = draftGenerateResponseSchema.parse({
      draft_id: `draft_${slugify(body.base_prompt).slice(0, 24)}`,
      draft_text: `${copy.draftGenerate.draftTextPrefix}: ${body.base_prompt}`,
      outline: copy.draftGenerate.outline,
      reference_notes: body.enable_search
        ? [copy.draftGenerate.referenceNotes.searchEnabled]
        : [copy.draftGenerate.referenceNotes.localOnly],
      status: "draft",
    })

    return success(data, request.id, copy.envelopeMessages.scaffolded)
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

    const data = draftRefineResponseSchema.parse({
      draft_id: body.draft_id,
      draft_text: `${copy.draftRefine.draftTextPrefix} ${body.draft_id}: ${body.user_feedback}`,
      outline: copy.draftRefine.outline,
      reference_notes: copy.draftRefine.referenceNotes,
      status: "draft",
    })

    return success(data, request.id, copy.envelopeMessages.scaffolded)
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

    const data = commitWorldResponseSchema.parse({
      world_id: `world_${slugify(body.world_name)}`,
      status: "processing",
      queued_jobs: ["draft_commit_extraction", "embedding_sync"],
    })

    return success(data, request.id, copy.envelopeMessages.queued)
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

    const data = createSessionResponseSchema.parse({
      session_id: `session_${crypto.randomUUID().slice(0, 8)}`,
      world_id: body.world_id,
      title: body.title ?? copy.session.defaultTitle,
      status: "active",
    })

    return success(data, request.id, copy.envelopeMessages.created)
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

    const data = chatSendResponseSchema.parse({
      session_id: body.session_id,
      assistant_message: copy.chat.assistantMessage,
      queued_jobs: ["session_memory_extraction", "session_summary"],
    })

    return success(data, request.id, copy.envelopeMessages.scaffolded)
  })
}
