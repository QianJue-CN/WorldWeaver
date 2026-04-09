import {
  defaultLocale as fallbackLocale,
  type AppLocale as LocaleCode,
} from "@worldweaver/config"
import {
  type ApiEnvelope,
  type BootstrapCatalogResponse,
  bootstrapCatalogResponseSchema,
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

type ApiRequestOptions = {
  locale?: LocaleCode
}

const fallbackApiBaseUrl = "http://localhost:4000"

export const apiBaseUrl = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl,
)

const apiErrorCopy = {
  en: {
    validation:
      "Validation failed. Review the current form values and try again.",
    apiError: "API error: {message}",
    httpFailure: "Request failed with HTTP {status}.",
    nonJson: "The API returned a non-JSON response.",
    network:
      "Unable to reach the API at {apiBaseUrl}. Start the local API service and verify NEXT_PUBLIC_API_BASE_URL.",
    unexpected: "An unexpected error occurred.",
  },
  "zh-CN": {
    validation: "校验失败。请检查当前表单内容后再试一次。",
    apiError: "API 错误：{message}",
    httpFailure: "请求失败，HTTP 状态码为 {status}。",
    nonJson: "API 返回的不是合法 JSON 响应。",
    network:
      "无法连接到 {apiBaseUrl}。请启动本地 API 服务，并确认 NEXT_PUBLIC_API_BASE_URL 配置正确。",
    unexpected: "发生了未预期的错误。",
  },
} as const satisfies Record<
  LocaleCode,
  {
    validation: string
    apiError: string
    httpFailure: string
    nonJson: string
    network: string
    unexpected: string
  }
>

function formatTemplate(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

function normalizeApiBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function createUrl(path: string) {
  return `${apiBaseUrl}${path}`
}

function createLocalizedPath(path: string, locale: LocaleCode) {
  const searchParams = new URLSearchParams({
    locale,
  })

  return `${path}?${searchParams.toString()}`
}

function extractErrorMessage(
  payload: unknown,
  status: number,
  locale: LocaleCode,
) {
  const copy = apiErrorCopy[locale]

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    if (payload.message === "validation_error") {
      return copy.validation
    }

    return formatTemplate(copy.apiError, {
      message: payload.message,
    })
  }

  return formatTemplate(copy.httpFailure, {
    status,
  })
}

async function parseJsonResponse(response: Response, locale: LocaleCode) {
  try {
    return await response.json()
  } catch {
    throw new Error(apiErrorCopy[locale].nonJson)
  }
}

async function requestEnvelope<T>(
  path: string,
  init: RequestInit,
  parse: (payload: unknown) => ApiEnvelope<T>,
  options: ApiRequestOptions = {},
) {
  const locale = options.locale ?? fallbackLocale
  let response: Response

  try {
    response = await fetch(createUrl(path), {
      cache: "no-store",
      ...init,
      headers: {
        "Accept-Language": locale,
        "Content-Type": "application/json",
        "X-WorldWeaver-Locale": locale,
        ...(init.headers ?? {}),
      },
    })
  } catch {
    throw new Error(
      formatTemplate(apiErrorCopy[locale].network, { apiBaseUrl }),
    )
  }

  const payload = await parseJsonResponse(response, locale)

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.status, locale))
  }

  return parse(payload)
}

export function getErrorMessage(
  error: unknown,
  locale: LocaleCode = fallbackLocale,
) {
  if (error instanceof Error) {
    return error.message
  }

  return apiErrorCopy[locale].unexpected
}

export async function getHealth(options: ApiRequestOptions = {}) {
  return requestEnvelope<HealthResponse>(
    "/api/health",
    {
      method: "GET",
    },
    (payload) => createApiEnvelopeSchema(healthResponseSchema).parse(payload),
    options,
  )
}

export async function getBootstrapCatalog(
  locale: LocaleCode,
  options: ApiRequestOptions = {},
) {
  return requestEnvelope<BootstrapCatalogResponse>(
    createLocalizedPath("/api/bootstrap", locale),
    {
      method: "GET",
    },
    (payload) =>
      createApiEnvelopeSchema(bootstrapCatalogResponseSchema).parse(payload),
    {
      ...options,
      locale,
    },
  )
}

export async function generateDraft(
  input: DraftGenerateRequest,
  options: ApiRequestOptions = {},
) {
  return requestEnvelope<DraftGenerateResponse>(
    "/api/worlds/drafts/generate",
    {
      method: "POST",
      body: JSON.stringify(draftGenerateRequestSchema.parse(input)),
    },
    (payload) =>
      createApiEnvelopeSchema(draftGenerateResponseSchema).parse(payload),
    options,
  )
}

export async function refineDraft(
  input: DraftRefineRequest,
  options: ApiRequestOptions = {},
) {
  return requestEnvelope<DraftRefineResponse>(
    "/api/worlds/drafts/refine",
    {
      method: "POST",
      body: JSON.stringify(draftRefineRequestSchema.parse(input)),
    },
    (payload) =>
      createApiEnvelopeSchema(draftRefineResponseSchema).parse(payload),
    options,
  )
}

export async function commitWorld(
  input: CommitWorldRequest,
  options: ApiRequestOptions = {},
) {
  return requestEnvelope<CommitWorldResponse>(
    "/api/worlds/commit",
    {
      method: "POST",
      body: JSON.stringify(commitWorldRequestSchema.parse(input)),
    },
    (payload) =>
      createApiEnvelopeSchema(commitWorldResponseSchema).parse(payload),
    options,
  )
}

export async function createSession(
  input: CreateSessionRequest,
  options: ApiRequestOptions = {},
) {
  return requestEnvelope<CreateSessionResponse>(
    "/api/sessions",
    {
      method: "POST",
      body: JSON.stringify(createSessionRequestSchema.parse(input)),
    },
    (payload) =>
      createApiEnvelopeSchema(createSessionResponseSchema).parse(payload),
    options,
  )
}

export async function sendChat(
  input: ChatSendRequest,
  options: ApiRequestOptions = {},
) {
  return requestEnvelope<ChatSendResponse>(
    "/api/chat/send",
    {
      method: "POST",
      body: JSON.stringify(chatSendRequestSchema.parse(input)),
    },
    (payload) => createApiEnvelopeSchema(chatSendResponseSchema).parse(payload),
    options,
  )
}
