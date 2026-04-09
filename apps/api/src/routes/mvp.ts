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
import { success } from "../lib/response.js"
import { parseBody } from "../lib/validation.js"

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalized || "world"
}

export const mvpRoutes: FastifyPluginAsync = async (app) => {
  app.post("/worlds/drafts/generate", async (request, reply) => {
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
      draft_text: `Scaffold placeholder for world draft: ${body.base_prompt}`,
      outline: [
        "Core premise",
        "Major factions",
        "Signature locations",
        "Rule constraints",
      ],
      reference_notes: body.enable_search
        ? ["Search provider integration is scaffolded but not connected yet."]
        : ["Local-only draft generation scaffold active."],
      status: "draft",
    })

    return success(data, request.id, "scaffolded")
  })

  app.post("/worlds/drafts/refine", async (request, reply) => {
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
      draft_text: `Scaffold refinement for ${body.draft_id}: ${body.user_feedback}`,
      outline: ["Updated premise", "Adjusted factions", "Revision notes"],
      reference_notes: [
        "Refinement pipeline contract is ready for provider wiring.",
      ],
      status: "draft",
    })

    return success(data, request.id, "scaffolded")
  })

  app.post("/worlds/commit", async (request, reply) => {
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

    return success(data, request.id, "queued")
  })

  app.post("/sessions", async (request, reply) => {
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
      title: body.title ?? "New Session",
      status: "active",
    })

    return success(data, request.id, "created")
  })

  app.post("/chat/send", async (request, reply) => {
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
      assistant_message:
        "Scaffold reply: the memory engine, retrieval layer, and model adapter will attach here next.",
      queued_jobs: ["session_memory_extraction", "session_summary"],
    })

    return success(data, request.id, "scaffolded")
  })
}
