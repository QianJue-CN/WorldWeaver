import { z } from "zod"

export const providerKindSchema = z.enum([
  "openai",
  "gemini",
  "anthropic",
  "mock",
])
export const providerCapabilitySchema = z.enum(["text_generation", "embedding"])
export const providerStatusSchema = z.enum([
  "ready",
  "mock",
  "missing_credentials",
])

export const providerConfigDescriptorSchema = z.object({
  id: z.string().min(1),
  provider: providerKindSchema,
  label: z.string().min(1),
  capabilities: z.array(providerCapabilitySchema).min(1),
  language_model: z.string().min(1).nullable(),
  embedding_model: z.string().min(1).nullable(),
  status: providerStatusSchema,
})

export const providerConfigSourceSchema = z.enum(["system", "user"])

export const savedProviderConfigSchema = z.object({
  provider_config_id: z.string().min(1),
  owner_id: z.string().min(1).nullable(),
  source: providerConfigSourceSchema,
  label: z.string().min(1),
  provider: providerKindSchema,
  api_base_url: z.string().min(1),
  text_model: z.string().min(1),
  embedding_model: z.string().min(1).nullable(),
  capabilities: z.array(providerCapabilitySchema).min(1),
  status: providerStatusSchema,
  api_key_preview: z.string().min(1).nullable(),
  is_default: z.boolean(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
})

export const providerConfigListQuerySchema = z.object({
  owner_id: z.string().min(1),
})

export const upsertProviderConfigRequestSchema = z
  .object({
    provider_config_id: z.string().min(1).optional(),
    owner_id: z.string().min(1),
    label: z.string().min(1),
    provider: z.enum(["openai", "gemini", "anthropic"]),
    api_base_url: z.string().url(),
    api_key: z.string().min(1).optional(),
    text_model: z.string().min(1),
    embedding_model: z.string().min(1).nullable().optional(),
    is_default: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    if (!value.provider_config_id && !value.api_key) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["api_key"],
        message: "api_key is required when creating a new provider config.",
      })
    }

    if (value.provider === "anthropic" && value.embedding_model) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["embedding_model"],
        message:
          "Anthropic format does not provide an embedding endpoint. Leave embedding_model empty or use another provider format.",
      })
    }
  })

export const providerConfigListResponseSchema = z.object({
  items: z.array(savedProviderConfigSchema),
  active_provider_config_id: z.string().min(1).nullable(),
})

export const deleteProviderConfigParamsSchema = z.object({
  providerConfigId: z.string().min(1),
})

export const deleteProviderConfigResponseSchema = z.object({
  provider_config_id: z.string().min(1),
  deleted: z.literal(true),
})

export type ProviderKind = z.infer<typeof providerKindSchema>
export type ProviderCapability = z.infer<typeof providerCapabilitySchema>
export type ProviderStatus = z.infer<typeof providerStatusSchema>
export type ProviderConfigDescriptor = z.infer<
  typeof providerConfigDescriptorSchema
>
export type ProviderConfigSource = z.infer<typeof providerConfigSourceSchema>
export type SavedProviderConfig = z.infer<typeof savedProviderConfigSchema>
export type ProviderConfigListQuery = z.infer<
  typeof providerConfigListQuerySchema
>
export type UpsertProviderConfigRequest = z.infer<
  typeof upsertProviderConfigRequestSchema
>
export type ProviderConfigListResponse = z.infer<
  typeof providerConfigListResponseSchema
>
export type DeleteProviderConfigParams = z.infer<
  typeof deleteProviderConfigParamsSchema
>
export type DeleteProviderConfigResponse = z.infer<
  typeof deleteProviderConfigResponseSchema
>
