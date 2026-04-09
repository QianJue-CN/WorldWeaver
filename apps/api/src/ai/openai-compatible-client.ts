import {
  providerRequestFailedError,
  providerResponseInvalidError,
} from "../lib/api-error.js"
import type {
  ResolvedEmbeddingProvider,
  ResolvedTextProvider,
} from "./provider-registry.js"

type FetchLike = typeof fetch

type OpenAiStructuredRequest = {
  providerConfigId: string
  instructions: string
  input: string
  model: string
  temperature?: number
}

type OpenAiEmbeddingRequest = {
  providerConfigId: string
  input: string
  model: string
  dimensions?: number | null
}

type OpenAiPayload = {
  model?: unknown
  choices?: Array<{
    message?: {
      content?: unknown
    }
  }>
  data?: Array<{
    embedding?: unknown
  }>
  error?: {
    message?: unknown
  }
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function readErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message
  }

  return "The OpenAI-compatible service returned an unknown error."
}

export class OpenAiCompatibleClient {
  constructor(
    private readonly provider: ResolvedTextProvider | ResolvedEmbeddingProvider,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async generateJson(request: OpenAiStructuredRequest) {
    const response = await this.fetchImpl(
      `${normalizeBaseUrl(this.provider.apiBaseUrl)}/chat/completions`,
      {
        method: "POST",
        headers: this.createHeaders(),
        body: JSON.stringify({
          model: request.model,
          temperature: request.temperature ?? 0.4,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: request.instructions,
            },
            {
              role: "user",
              content: request.input,
            },
          ],
        }),
        signal: AbortSignal.timeout(this.provider.timeoutMs),
      },
    )

    const payload = (await response.json()) as OpenAiPayload

    if (!response.ok) {
      throw providerRequestFailedError(request.providerConfigId, "openai", {
        status: response.status,
        message: readErrorMessage(payload),
      })
    }

    const content = payload?.choices?.[0]?.message?.content

    if (typeof content !== "string" || content.trim().length === 0) {
      throw providerResponseInvalidError(request.providerConfigId, "openai", {
        reason:
          "Missing choices[0].message.content in chat completion response.",
      })
    }

    return {
      text: content,
      model:
        typeof payload?.model === "string" && payload.model.length > 0
          ? payload.model
          : request.model,
    }
  }

  async embedText(request: OpenAiEmbeddingRequest) {
    const response = await this.fetchImpl(
      `${normalizeBaseUrl(this.provider.apiBaseUrl)}/embeddings`,
      {
        method: "POST",
        headers: this.createHeaders(),
        body: JSON.stringify({
          model: request.model,
          input: request.input,
          ...(request.dimensions ? { dimensions: request.dimensions } : {}),
        }),
        signal: AbortSignal.timeout(this.provider.timeoutMs),
      },
    )

    const payload = (await response.json()) as OpenAiPayload

    if (!response.ok) {
      throw providerRequestFailedError(request.providerConfigId, "openai", {
        status: response.status,
        message: readErrorMessage(payload),
      })
    }

    const embedding = payload?.data?.[0]?.embedding

    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw providerResponseInvalidError(request.providerConfigId, "openai", {
        reason: "Missing data[0].embedding in embedding response.",
      })
    }

    return {
      vector: embedding,
      model:
        typeof payload?.model === "string" && payload.model.length > 0
          ? payload.model
          : request.model,
    }
  }

  private createHeaders() {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.provider.apiKey}`,
      "Content-Type": "application/json",
    }

    if (this.provider.organization) {
      headers["OpenAI-Organization"] = this.provider.organization
    }

    if (this.provider.project) {
      headers["OpenAI-Project"] = this.provider.project
    }

    return headers
  }
}
