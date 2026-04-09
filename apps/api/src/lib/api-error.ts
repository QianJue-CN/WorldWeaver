export class ApiRouteError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    readonly details: unknown = {},
  ) {
    super(code)
    this.name = "ApiRouteError"
  }
}

export function notFoundError(
  entity: "draft" | "world" | "session",
  id: string,
) {
  return new ApiRouteError(404, `${entity}_not_found`, {
    entity,
    id,
  })
}

export function providerConfigNotFoundError(id: string) {
  return new ApiRouteError(400, "provider_config_not_found", {
    id,
  })
}

export function providerCapabilityUnavailableError(
  id: string,
  capability: "text_generation" | "embedding",
) {
  return new ApiRouteError(400, "provider_capability_unavailable", {
    id,
    capability,
  })
}

export function providerNotConfiguredError(
  id: string,
  provider: "openai" | "gemini" | "anthropic" | "mock",
  missingEnvKeys: string[],
) {
  return new ApiRouteError(503, "provider_not_configured", {
    id,
    provider,
    missing_env_keys: missingEnvKeys,
  })
}

export function providerRequestFailedError(
  id: string,
  provider: "openai" | "gemini" | "anthropic" | "mock",
  details: {
    status?: number
    message: string
  },
) {
  return new ApiRouteError(502, "provider_request_failed", {
    id,
    provider,
    status: details.status ?? null,
    message: details.message,
  })
}

export function providerResponseInvalidError(
  id: string,
  provider: "openai" | "gemini" | "anthropic" | "mock",
  details: {
    reason: string
  },
) {
  return new ApiRouteError(502, "provider_response_invalid", {
    id,
    provider,
    reason: details.reason,
  })
}
