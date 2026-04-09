import { AiGateway } from "../ai/ai-gateway.js"
import { ProviderRegistry } from "../ai/provider-registry.js"
import { LocalStateRepository } from "../repositories/local-state.js"
import { MvpService } from "../services/mvp-service.js"
import { ProviderConfigService } from "../services/provider-config-service.js"
import { env } from "./env.js"

export const localStateRepository = new LocalStateRepository()
export const providerRegistry = new ProviderRegistry(localStateRepository, env)
export const aiGateway = new AiGateway(providerRegistry)
export const mvpService = new MvpService(localStateRepository, aiGateway)
export const providerConfigService = new ProviderConfigService(
  localStateRepository,
  providerRegistry,
)
