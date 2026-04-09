import {
  providerRequestFailedError,
  providerResponseInvalidError,
} from "../lib/api-error.js"
import type {
  ResolvedEmbeddingProvider,
  ResolvedTextProvider,
} from "./provider-registry.js"

type FetchLike = typeof fetch

type GeminiStructuredRequest = {
  providerConfigId: string
  instructions: string
  input: string
  model: string
  temperature?: number
}

type GeminiEmbeddingRequest = {
  providerConfigId: string
  input: string
  model: string
  purpose: "document" | "query"
}

type GeminiPayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  embedding?: {
    values?: unknown
  }
  error?: {
    message?: unknown
  }
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function readGeminiError(payload: unknown) {
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

  return "The Gemini-compatible service returned an unknown error."
}

export class GeminiClient {
  constructor(
    private readonly provider: ResolvedTextProvider | ResolvedEmbeddingProvider,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async generateJson(request: GeminiStructuredRequest) {
    const response = await this.fetchImpl(
      `${normalizeBaseUrl(this.provider.apiBaseUrl)}/models/${encodeURIComponent(
        request.model,
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": String(this.provider.apiKey),
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: request.instructions,
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: request.input,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: request.temperature ?? 0.4,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(this.provider.timeoutMs),
      },
    )

    const payload = (await response.json()) as GeminiPayload

    if (!response.ok) {
      throw providerRequestFailedError(request.providerConfigId, "gemini", {
        status: response.status,
        message: readGeminiError(payload),
      })
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")

    if (typeof text !== "string" || text.trim().length === 0) {
      throw providerResponseInvalidError(request.providerConfigId, "gemini", {
        reason:
          "Missing candidates[0].content.parts text in generateContent response.",
      })
    }

    return {
      text,
      model: request.model,
    }
  }

  async embedText(request: GeminiEmbeddingRequest) {
    const response = await this.fetchImpl(
      `${normalizeBaseUrl(this.provider.apiBaseUrl)}/models/${encodeURIComponent(
        request.model,
      )}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": String(this.provider.apiKey),
        },
        body: JSON.stringify({
          content: {
            parts: [
              {
                text: request.input,
              },
            ],
          },
          taskType:
            request.purpose === "query"
              ? "RETRIEVAL_QUERY"
              : "RETRIEVAL_DOCUMENT",
        }),
        signal: AbortSignal.timeout(this.provider.timeoutMs),
      },
    )

    const payload = (await response.json()) as GeminiPayload

    if (!response.ok) {
      throw providerRequestFailedError(request.providerConfigId, "gemini", {
        status: response.status,
        message: readGeminiError(payload),
      })
    }

    const vector = payload?.embedding?.values

    if (!Array.isArray(vector) || vector.length === 0) {
      throw providerResponseInvalidError(request.providerConfigId, "gemini", {
        reason: "Missing embedding.values in embedContent response.",
      })
    }

    return {
      vector,
      model: request.model,
    }
  }
}
