import {
  type ApiEnvelope,
  type ChatSendRequest,
  type ChatSendResponse,
  type CommitWorldRequest,
  type CommitWorldResponse,
  type CreateSessionRequest,
  type CreateSessionResponse,
  chatSendRequestSchema,
  chatSendResponseSchema,
  commitWorldRequestSchema,
  commitWorldResponseSchema,
  createApiEnvelopeSchema,
  createSessionRequestSchema,
  createSessionResponseSchema,
  type DraftGenerateRequest,
  type DraftGenerateResponse,
  type DraftRefineRequest,
  type DraftRefineResponse,
  draftGenerateRequestSchema,
  draftGenerateResponseSchema,
  draftRefineRequestSchema,
  draftRefineResponseSchema,
  type HealthResponse,
  healthResponseSchema,
} from "@worldweaver/contracts"

const fallbackApiBaseUrl = "http://localhost:4000"

export const apiBaseUrl = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl,
)

function normalizeApiBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function createUrl(path: string) {
  return `${apiBaseUrl}${path}`
}

function extractErrorMessage(payload: unknown, status: number) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    if (payload.message === "validation_error") {
      return "Validation failed. Review the current form values and try again."
    }

    return `API error: ${payload.message}`
  }

  return `Request failed with HTTP ${status}.`
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json()
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "The API returned a non-JSON response.",
    )
  }
}

async function requestEnvelope<T>(
  path: string,
  init: RequestInit,
  parse: (payload: unknown) => ApiEnvelope<T>,
) {
  let response: Response

  try {
    response = await fetch(createUrl(path), {
      cache: "no-store",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    })
  } catch {
    throw new Error(
      `Unable to reach the API at ${apiBaseUrl}. Start the local API service and verify NEXT_PUBLIC_API_BASE_URL.`,
    )
  }

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.status))
  }

  return parse(payload)
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred."
}

export async function getHealth() {
  return requestEnvelope<HealthResponse>(
    "/api/health",
    {
      method: "GET",
    },
    (payload) => createApiEnvelopeSchema(healthResponseSchema).parse(payload),
  )
}

export async function generateDraft(input: DraftGenerateRequest) {
  return requestEnvelope<DraftGenerateResponse>(
    "/api/worlds/drafts/generate",
    {
      method: "POST",
      body: JSON.stringify(draftGenerateRequestSchema.parse(input)),
    },
    (payload) =>
      createApiEnvelopeSchema(draftGenerateResponseSchema).parse(payload),
  )
}

export async function refineDraft(input: DraftRefineRequest) {
  return requestEnvelope<DraftRefineResponse>(
    "/api/worlds/drafts/refine",
    {
      method: "POST",
      body: JSON.stringify(draftRefineRequestSchema.parse(input)),
    },
    (payload) =>
      createApiEnvelopeSchema(draftRefineResponseSchema).parse(payload),
  )
}

export async function commitWorld(input: CommitWorldRequest) {
  return requestEnvelope<CommitWorldResponse>(
    "/api/worlds/commit",
    {
      method: "POST",
      body: JSON.stringify(commitWorldRequestSchema.parse(input)),
    },
    (payload) =>
      createApiEnvelopeSchema(commitWorldResponseSchema).parse(payload),
  )
}

export async function createSession(input: CreateSessionRequest) {
  return requestEnvelope<CreateSessionResponse>(
    "/api/sessions",
    {
      method: "POST",
      body: JSON.stringify(createSessionRequestSchema.parse(input)),
    },
    (payload) =>
      createApiEnvelopeSchema(createSessionResponseSchema).parse(payload),
  )
}

export async function sendChat(input: ChatSendRequest) {
  return requestEnvelope<ChatSendResponse>(
    "/api/chat/send",
    {
      method: "POST",
      body: JSON.stringify(chatSendRequestSchema.parse(input)),
    },
    (payload) => createApiEnvelopeSchema(chatSendResponseSchema).parse(payload),
  )
}
