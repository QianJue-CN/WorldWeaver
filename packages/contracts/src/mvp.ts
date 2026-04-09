import { z } from "zod"

export const providerConfigIdSchema = z.string().min(1)
export const worldStatusSchema = z.enum([
  "draft",
  "processing",
  "active",
  "archived",
])
export const sessionStatusSchema = z.enum(["active", "paused", "ended"])

export const draftGenerateRequestSchema = z.object({
  base_prompt: z.string().min(1),
  enable_search: z.boolean(),
  provider_config_id: providerConfigIdSchema,
})

export const draftGenerateResponseSchema = z.object({
  draft_id: z.string().min(1),
  draft_text: z.string().min(1),
  outline: z.array(z.string().min(1)),
  reference_notes: z.array(z.string().min(1)),
  status: z.literal("draft"),
})

export const draftRefineRequestSchema = z.object({
  draft_id: z.string().min(1),
  user_feedback: z.string().min(1),
  provider_config_id: providerConfigIdSchema,
})

export const draftRefineResponseSchema = draftGenerateResponseSchema

export const commitWorldRequestSchema = z.object({
  draft_id: z.string().min(1),
  world_name: z.string().min(1),
  theme: z.string().min(1),
})

export const commitWorldResponseSchema = z.object({
  world_id: z.string().min(1),
  status: z.literal("processing"),
  queued_jobs: z.array(z.string().min(1)).min(1),
})

export const createSessionRequestSchema = z.object({
  world_id: z.string().min(1),
  user_id: z.string().min(1),
  title: z.string().min(1).optional(),
})

export const createSessionResponseSchema = z.object({
  session_id: z.string().min(1),
  world_id: z.string().min(1),
  title: z.string().min(1),
  status: z.literal("active"),
})

export const chatSendRequestSchema = z.object({
  session_id: z.string().min(1),
  user_message: z.string().min(1),
  provider_config_id: providerConfigIdSchema,
})

export const chatSendResponseSchema = z.object({
  session_id: z.string().min(1),
  assistant_message: z.string().min(1),
  queued_jobs: z.array(z.string().min(1)).min(1),
})

export type DraftGenerateRequest = z.infer<typeof draftGenerateRequestSchema>
export type DraftGenerateResponse = z.infer<typeof draftGenerateResponseSchema>
export type DraftRefineRequest = z.infer<typeof draftRefineRequestSchema>
export type DraftRefineResponse = z.infer<typeof draftRefineResponseSchema>
export type CommitWorldRequest = z.infer<typeof commitWorldRequestSchema>
export type CommitWorldResponse = z.infer<typeof commitWorldResponseSchema>
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>
export type ChatSendRequest = z.infer<typeof chatSendRequestSchema>
export type ChatSendResponse = z.infer<typeof chatSendResponseSchema>
