import {
  type AppLocale,
  getProviderCatalog,
  mockLocalProviderConfigId,
  openAiDefaultProviderConfigId,
} from "@worldweaver/config"
import type {
  ProviderConfigDescriptor,
  SavedProviderConfig,
} from "@worldweaver/contracts"
import {
  providerCapabilityUnavailableError,
  providerConfigNotFoundError,
  providerNotConfiguredError,
} from "../lib/api-error.js"
import type { ApiEnv } from "../lib/env.js"
import type {
  LocalStateRepository,
  StoredProviderConfig,
} from "../repositories/local-state.js"

type BaseResolvedProvider = {
  id: string
  label: string
  apiBaseUrl: string
}

export type ResolvedTextProvider = BaseResolvedProvider & {
  provider: "openai" | "gemini" | "anthropic" | "mock"
  textModel: string
  apiKey: string | null
  timeoutMs: number
  organization: string | null
  project: string | null
}

export type ResolvedEmbeddingProvider = BaseResolvedProvider & {
  provider: "openai" | "gemini" | "mock"
  embeddingModel: string
  apiKey: string | null
  timeoutMs: number
  organization: string | null
  project: string | null
  dimensions: number | null
}

function maskApiKey(value: string) {
  const trimmed = value.trim()

  if (trimmed.length <= 8) {
    return "********"
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
}

function getCapabilities(config: {
  provider: "openai" | "gemini" | "anthropic"
  embedding_model: string | null
}) {
  if (config.provider === "anthropic" || !config.embedding_model) {
    return ["text_generation"] as const
  }

  return ["text_generation", "embedding"] as const
}

export class ProviderRegistry {
  constructor(
    private readonly repository: LocalStateRepository,
    private readonly env: ApiEnv,
  ) {}

  listSystemProviderDescriptors(locale: AppLocale): ProviderConfigDescriptor[] {
    return getProviderCatalog(locale).map((entry) => {
      if (entry.id === openAiDefaultProviderConfigId) {
        return {
          id: entry.id,
          provider: entry.provider,
          label: entry.label,
          capabilities: [...entry.capabilities],
          language_model: this.env.OPENAI_TEXT_MODEL,
          embedding_model: this.env.OPENAI_EMBEDDING_MODEL,
          status: this.env.OPENAI_API_KEY ? "ready" : "missing_credentials",
        }
      }

      return {
        id: entry.id,
        provider: entry.provider,
        label: entry.label,
        capabilities: [...entry.capabilities],
        language_model: entry.language_model,
        embedding_model: entry.embedding_model,
        status: "mock",
      }
    })
  }

  async listSavedProviderConfigs(
    ownerId: string,
    locale: AppLocale,
  ): Promise<{
    items: SavedProviderConfig[]
    activeProviderConfigId: string | null
  }> {
    const systemItems = this.listSystemSavedConfigs(locale)
    const userItems = await this.repository.read((state) =>
      Object.values(state.provider_configs)
        .filter((item) => item.owner_id === ownerId)
        .sort((left, right) => (left.updated_at < right.updated_at ? 1 : -1)),
    )

    const describedUserItems = userItems.map((item) =>
      this.describeUserConfig(item),
    )
    const activeUserConfig = describedUserItems.find((item) => item.is_default)

    return {
      items: [...describedUserItems, ...systemItems],
      activeProviderConfigId:
        activeUserConfig?.provider_config_id ?? mockLocalProviderConfigId,
    }
  }

  async resolveTextProvider(
    providerConfigId: string,
  ): Promise<ResolvedTextProvider> {
    if (providerConfigId === openAiDefaultProviderConfigId) {
      if (!this.env.OPENAI_API_KEY) {
        throw providerNotConfiguredError(providerConfigId, "openai", [
          "OPENAI_API_KEY",
        ])
      }

      return {
        id: providerConfigId,
        label: "OpenAI default",
        provider: "openai",
        apiBaseUrl: this.env.OPENAI_BASE_URL,
        apiKey: this.env.OPENAI_API_KEY,
        textModel: this.env.OPENAI_TEXT_MODEL,
        timeoutMs: this.env.OPENAI_TIMEOUT_MS,
        organization: this.env.OPENAI_ORGANIZATION ?? null,
        project: this.env.OPENAI_PROJECT ?? null,
      }
    }

    if (providerConfigId === mockLocalProviderConfigId) {
      return {
        id: providerConfigId,
        label: "Local mock provider",
        provider: "mock",
        apiBaseUrl: "mock://local",
        apiKey: null,
        textModel: "mock-worldweaver-001",
        timeoutMs: this.env.OPENAI_TIMEOUT_MS,
        organization: null,
        project: null,
      }
    }

    const userConfig = await this.readStoredProviderConfig(providerConfigId)

    return {
      id: userConfig.provider_config_id,
      label: userConfig.label,
      provider: userConfig.provider,
      apiBaseUrl: userConfig.api_base_url,
      apiKey: userConfig.api_key,
      textModel: userConfig.text_model,
      timeoutMs: this.env.OPENAI_TIMEOUT_MS,
      organization: null,
      project: null,
    }
  }

  async resolveEmbeddingProvider(
    providerConfigId: string,
  ): Promise<ResolvedEmbeddingProvider> {
    if (providerConfigId === openAiDefaultProviderConfigId) {
      if (!this.env.OPENAI_API_KEY) {
        throw providerNotConfiguredError(providerConfigId, "openai", [
          "OPENAI_API_KEY",
        ])
      }

      return {
        id: providerConfigId,
        label: "OpenAI default",
        provider: "openai",
        apiBaseUrl: this.env.OPENAI_BASE_URL,
        apiKey: this.env.OPENAI_API_KEY,
        embeddingModel: this.env.OPENAI_EMBEDDING_MODEL,
        timeoutMs: this.env.OPENAI_TIMEOUT_MS,
        organization: this.env.OPENAI_ORGANIZATION ?? null,
        project: this.env.OPENAI_PROJECT ?? null,
        dimensions: this.env.OPENAI_EMBEDDING_DIMENSIONS ?? null,
      }
    }

    if (providerConfigId === mockLocalProviderConfigId) {
      return {
        id: providerConfigId,
        label: "Local mock provider",
        provider: "mock",
        apiBaseUrl: "mock://local",
        apiKey: null,
        embeddingModel: "mock-embedding-001",
        timeoutMs: this.env.OPENAI_TIMEOUT_MS,
        organization: null,
        project: null,
        dimensions: this.env.MOCK_EMBEDDING_DIMENSIONS,
      }
    }

    const userConfig = await this.readStoredProviderConfig(providerConfigId)

    if (userConfig.provider === "anthropic" || !userConfig.embedding_model) {
      throw providerCapabilityUnavailableError(providerConfigId, "embedding")
    }

    return {
      id: userConfig.provider_config_id,
      label: userConfig.label,
      provider: userConfig.provider,
      apiBaseUrl: userConfig.api_base_url,
      apiKey: userConfig.api_key,
      embeddingModel: userConfig.embedding_model,
      timeoutMs: this.env.OPENAI_TIMEOUT_MS,
      organization: null,
      project: null,
      dimensions:
        userConfig.provider === "openai"
          ? (this.env.OPENAI_EMBEDDING_DIMENSIONS ?? null)
          : null,
    }
  }

  private async readStoredProviderConfig(providerConfigId: string) {
    const providerConfig = await this.repository.read(
      (state) => state.provider_configs[providerConfigId],
    )

    if (!providerConfig) {
      throw providerConfigNotFoundError(providerConfigId)
    }

    return providerConfig
  }

  private listSystemSavedConfigs(locale: AppLocale): SavedProviderConfig[] {
    const timestamp = new Date(0).toISOString()

    return this.listSystemProviderDescriptors(locale).map((descriptor) => ({
      provider_config_id: descriptor.id,
      owner_id: null,
      source: "system",
      label: descriptor.label,
      provider: descriptor.provider,
      api_base_url:
        descriptor.provider === "openai"
          ? this.env.OPENAI_BASE_URL
          : "mock://local",
      text_model: descriptor.language_model ?? "n/a",
      embedding_model: descriptor.embedding_model,
      capabilities: [...descriptor.capabilities],
      status: descriptor.status,
      api_key_preview:
        descriptor.provider === "openai" && this.env.OPENAI_API_KEY
          ? maskApiKey(this.env.OPENAI_API_KEY)
          : null,
      is_default: descriptor.id === mockLocalProviderConfigId,
      created_at: timestamp,
      updated_at: timestamp,
    }))
  }

  private describeUserConfig(
    config: StoredProviderConfig,
  ): SavedProviderConfig {
    return {
      provider_config_id: config.provider_config_id,
      owner_id: config.owner_id,
      source: "user",
      label: config.label,
      provider: config.provider,
      api_base_url: config.api_base_url,
      text_model: config.text_model,
      embedding_model: config.embedding_model,
      capabilities: [...getCapabilities(config)],
      status: "ready",
      api_key_preview: maskApiKey(config.api_key),
      is_default: config.is_default,
      created_at: config.created_at,
      updated_at: config.updated_at,
    }
  }
}
