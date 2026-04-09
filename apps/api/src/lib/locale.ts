import { type AppLocale, resolveLocale } from "@worldweaver/config"
import type { FastifyRequest } from "fastify"

function readHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export function getRequestLocale(
  request: FastifyRequest,
  preferred?: string | null,
): AppLocale {
  const explicitHeader = readHeaderValue(
    request.headers["x-worldweaver-locale"],
  )
  const acceptLanguage = readHeaderValue(request.headers["accept-language"])

  return resolveLocale(preferred ?? explicitHeader ?? acceptLanguage)
}
