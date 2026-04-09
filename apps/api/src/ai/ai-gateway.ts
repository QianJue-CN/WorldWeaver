import type { AppLocale } from "@worldweaver/config"
import type { z } from "zod"
import { providerResponseInvalidError } from "../lib/api-error.js"
import { AnthropicClient } from "./anthropic-client.js"
import { GeminiClient } from "./gemini-client.js"
import { MockClient } from "./mock-client.js"
import { OpenAiCompatibleClient } from "./openai-compatible-client.js"
import type {
  ProviderRegistry,
  ResolvedTextProvider,
} from "./provider-registry.js"

type AiTask = "draft_generate" | "draft_refine" | "chat_reply"

type StructuredGenerationRequest<T> = {
  providerConfigId: string
  task: AiTask
  locale: AppLocale
  instructions: string
  input: string
  schema: z.ZodType<T>
  temperature?: number
  context?: Record<string, unknown>
}

type EmbeddingRequest = {
  providerConfigId: string
  input: string
  purpose: "document" | "query"
}

function extractJsonObject(text: string) {
  const trimmed = text.trim()

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim()
  }

  return trimmed
}

export class AiGateway {
  constructor(private readonly registry: ProviderRegistry) {}

  async generateObject<T>(request: StructuredGenerationRequest<T>) {
    const provider = await this.registry.resolveTextProvider(
      request.providerConfigId,
    )
    const result = await this.generateJsonText(provider, request)

    try {
      return {
        object: request.schema.parse(
          JSON.parse(extractJsonObject(result.text)),
        ),
        provider: provider.provider,
        model: result.model,
      }
    } catch {
      throw providerResponseInvalidError(
        request.providerConfigId,
        provider.provider,
        {
          reason:
            "The provider returned invalid JSON for the requested schema.",
        },
      )
    }
  }

  async embedText(request: EmbeddingRequest) {
    const provider = await this.registry.resolveEmbeddingProvider(
      request.providerConfigId,
    )

    if (provider.provider === "mock") {
      const mockClient = new MockClient(provider)

      return {
        ...(await mockClient.embedText(request.input)),
        provider: provider.provider,
      }
    }

    if (provider.provider === "openai") {
      const client = new OpenAiCompatibleClient(provider)

      return {
        ...(await client.embedText({
          providerConfigId: request.providerConfigId,
          input: request.input,
          model: provider.embeddingModel,
          dimensions: provider.dimensions,
        })),
        provider: provider.provider,
      }
    }

    const client = new GeminiClient(provider)

    return {
      ...(await client.embedText({
        providerConfigId: request.providerConfigId,
        input: request.input,
        model: provider.embeddingModel,
        purpose: request.purpose,
      })),
      provider: provider.provider,
    }
  }

  private async generateJsonText<T>(
    provider: ResolvedTextProvider,
    request: StructuredGenerationRequest<T>,
  ) {
    if (provider.provider === "mock") {
      const mockClient = new MockClient({
        id: provider.id,
        label: provider.label,
        provider: "mock",
        apiBaseUrl: provider.apiBaseUrl,
        embeddingModel: "mock-embedding-001",
        apiKey: null,
        timeoutMs: provider.timeoutMs,
        organization: null,
        project: null,
        dimensions: 24,
      })

      return {
        text: await mockClient.generateJson({
          task: request.task,
          locale: request.locale,
          ...(request.context ? { context: request.context } : {}),
        }),
        model: provider.textModel,
      }
    }

    if (provider.provider === "openai") {
      const client = new OpenAiCompatibleClient(provider)

      return client.generateJson({
        providerConfigId: request.providerConfigId,
        instructions: request.instructions,
        input: request.input,
        model: provider.textModel,
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
      })
    }

    if (provider.provider === "gemini") {
      const client = new GeminiClient(provider)

      return client.generateJson({
        providerConfigId: request.providerConfigId,
        instructions: request.instructions,
        input: request.input,
        model: provider.textModel,
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
      })
    }

    const client = new AnthropicClient(provider)

    return client.generateJson({
      providerConfigId: request.providerConfigId,
      instructions: request.instructions,
      input: request.input,
      model: provider.textModel,
      ...(request.temperature !== undefined
        ? { temperature: request.temperature }
        : {}),
    })
  }
}
