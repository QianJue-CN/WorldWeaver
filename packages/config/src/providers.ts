import { type AppLocale, defaultLocale } from "./i18n.js"

export const openAiDefaultProviderConfigId = "cfg_openai_default" as const
export const mockLocalProviderConfigId = "cfg_mock_local" as const

export const providerRuntimeDefaults = {
  openAiBaseUrl: "https://api.openai.com/v1",
  openAiTextModel: "gpt-4.1-mini",
  openAiEmbeddingModel: "text-embedding-3-small",
  openAiTimeoutMs: 45000,
  mockEmbeddingDimensions: 24,
} as const

export type ProviderCapability = "text_generation" | "embedding"
export type ProviderKind = "openai" | "gemini" | "anthropic" | "mock"

type ProviderCatalogEntry = {
  id: string
  provider: ProviderKind
  label: string
  capabilities: readonly ProviderCapability[]
  language_model: string | null
  embedding_model: string | null
  env_keys: readonly string[]
}

const providerCatalogByLocale = {
  en: [
    {
      id: openAiDefaultProviderConfigId,
      provider: "openai",
      label: "OpenAI default",
      capabilities: ["text_generation", "embedding"],
      language_model: providerRuntimeDefaults.openAiTextModel,
      embedding_model: providerRuntimeDefaults.openAiEmbeddingModel,
      env_keys: ["OPENAI_API_KEY"],
    },
    {
      id: mockLocalProviderConfigId,
      provider: "mock",
      label: "Local mock provider",
      capabilities: ["text_generation", "embedding"],
      language_model: "mock-worldweaver-001",
      embedding_model: "mock-embedding-001",
      env_keys: [],
    },
  ],
  "zh-CN": [
    {
      id: openAiDefaultProviderConfigId,
      provider: "openai",
      label: "OpenAI 默认配置",
      capabilities: ["text_generation", "embedding"],
      language_model: providerRuntimeDefaults.openAiTextModel,
      embedding_model: providerRuntimeDefaults.openAiEmbeddingModel,
      env_keys: ["OPENAI_API_KEY"],
    },
    {
      id: mockLocalProviderConfigId,
      provider: "mock",
      label: "本地 Mock Provider",
      capabilities: ["text_generation", "embedding"],
      language_model: "mock-worldweaver-001",
      embedding_model: "mock-embedding-001",
      env_keys: [],
    },
  ],
} as const satisfies Record<AppLocale, readonly ProviderCatalogEntry[]>

export const providerCatalog = providerCatalogByLocale[defaultLocale]

export function getProviderCatalog(locale: AppLocale) {
  return providerCatalogByLocale[locale]
}
