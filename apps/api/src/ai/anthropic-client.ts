import {
  providerRequestFailedError,
  providerResponseInvalidError,
} from "../lib/api-error.js"
import type { ResolvedTextProvider } from "./provider-registry.js"

type FetchLike = typeof fetch

type AnthropicStructuredRequest = {
  providerConfigId: string
  instructions: string
  input: string
  model: string
  temperature?: number
}

type AnthropicPayload = {
  content?: Array<{
    type?: string
    text?: string
  }>
  error?: {
    message?: unknown
  }
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function readAnthropicError(payload: unknown) {
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

  return "The Anthropic-compatible service returned an unknown error."
}

export class AnthropicClient {
  constructor(
    private readonly provider: ResolvedTextProvider,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async generateJson(request: AnthropicStructuredRequest) {
    const response = await this.fetchImpl(
      `${normalizeBaseUrl(this.provider.apiBaseUrl)}/v1/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": String(this.provider.apiKey),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: 1200,
          temperature: request.temperature ?? 0.4,
          system: request.instructions,
          messages: [
            {
              role: "user",
              content: request.input,
            },
          ],
        }),
        signal: AbortSignal.timeout(this.provider.timeoutMs),
      },
    )

    const payload = (await response.json()) as AnthropicPayload

    if (!response.ok) {
      throw providerRequestFailedError(request.providerConfigId, "anthropic", {
        status: response.status,
        message: readAnthropicError(payload),
      })
    }

    const text = payload?.content
      ?.map((item: { type?: string; text?: string }) =>
        item.type === "text" ? (item.text ?? "") : "",
      )
      .join("")

    if (typeof text !== "string" || text.trim().length === 0) {
      throw providerResponseInvalidError(
        request.providerConfigId,
        "anthropic",
        {
          reason: "Missing text blocks in Anthropic messages response.",
        },
      )
    }

    return {
      text,
      model: request.model,
    }
  }
}
