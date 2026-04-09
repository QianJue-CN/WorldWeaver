import { type AppLocale, mockLocalProviderConfigId } from "@worldweaver/config"
import type {
  DeleteProviderConfigResponse,
  ProviderConfigListResponse,
  SavedProviderConfig,
  UpsertProviderConfigRequest,
} from "@worldweaver/contracts"
import type { ProviderRegistry } from "../ai/provider-registry.js"
import { ApiRouteError } from "../lib/api-error.js"
import type { LocalStateRepository } from "../repositories/local-state.js"

type ProviderConfigServiceOptions = {
  createId?: () => string
  now?: () => Date
}

export class ProviderConfigService {
  private readonly createId: () => string
  private readonly now: () => Date

  constructor(
    private readonly repository: LocalStateRepository,
    private readonly registry: ProviderRegistry,
    options: ProviderConfigServiceOptions = {},
  ) {
    this.createId = options.createId ?? (() => crypto.randomUUID().slice(0, 8))
    this.now = options.now ?? (() => new Date())
  }

  listConfigs(
    ownerId: string,
    locale: AppLocale,
  ): Promise<ProviderConfigListResponse> {
    return this.registry
      .listSavedProviderConfigs(ownerId, locale)
      .then((result) => ({
        items: result.items,
        active_provider_config_id: result.activeProviderConfigId,
      }))
  }

  async upsertConfig(
    input: UpsertProviderConfigRequest,
    locale: AppLocale,
  ): Promise<SavedProviderConfig> {
    const savedConfigId = await this.repository.mutate((state) => {
      const timestamp = this.now().toISOString()
      const ownerConfigs = Object.values(state.provider_configs).filter(
        (config) => config.owner_id === input.owner_id,
      )
      const nextConfigId =
        input.provider_config_id ?? `user_provider_${this.createId()}`
      const existing = state.provider_configs[nextConfigId]

      if (existing && existing.owner_id !== input.owner_id) {
        throw new ApiRouteError(404, "provider_config_not_found", {
          id: nextConfigId,
        })
      }

      const shouldBeDefault =
        input.is_default ??
        (ownerConfigs.length === 0 || existing?.is_default === true)

      if (shouldBeDefault) {
        for (const config of ownerConfigs) {
          config.is_default = config.provider_config_id === nextConfigId
        }
      }

      state.provider_configs[nextConfigId] = {
        provider_config_id: nextConfigId,
        owner_id: input.owner_id,
        label: input.label,
        provider: input.provider,
        api_base_url: input.api_base_url,
        api_key: input.api_key ?? existing?.api_key ?? "",
        text_model: input.text_model,
        embedding_model: input.embedding_model ?? null,
        is_default:
          shouldBeDefault ||
          (ownerConfigs.length === 0 &&
            nextConfigId !== mockLocalProviderConfigId),
        created_at: existing?.created_at ?? timestamp,
        updated_at: timestamp,
      }

      return nextConfigId
    })

    const { items } = await this.registry.listSavedProviderConfigs(
      input.owner_id,
      locale,
    )
    const savedConfig = items.find(
      (item) => item.provider_config_id === savedConfigId,
    )

    if (!savedConfig) {
      throw new Error("Unable to resolve the saved provider config.")
    }

    return savedConfig
  }

  async deleteConfig(
    ownerId: string,
    providerConfigId: string,
  ): Promise<DeleteProviderConfigResponse> {
    await this.repository.mutate((state) => {
      const existing = state.provider_configs[providerConfigId]

      if (!existing || existing.owner_id !== ownerId) {
        throw new ApiRouteError(404, "provider_config_not_found", {
          id: providerConfigId,
        })
      }

      const wasDefault = existing.is_default

      delete state.provider_configs[providerConfigId]

      if (wasDefault) {
        const nextDefault = Object.values(state.provider_configs).find(
          (config) => config.owner_id === ownerId,
        )

        if (nextDefault) {
          nextDefault.is_default = true
        }
      }
    })

    return {
      provider_config_id: providerConfigId,
      deleted: true,
    }
  }
}
