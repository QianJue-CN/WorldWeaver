import type { FastifyReply } from "fastify"
import type { z } from "zod"
import { validationError } from "./response.js"

export function parseBody<T>(
  schema: z.ZodType<T>,
  input: unknown,
  reply: FastifyReply,
  requestId: string,
) {
  const result = schema.safeParse(input)

  if (!result.success) {
    void reply
      .status(400)
      .send(validationError(result.error.flatten(), requestId))
    return
  }

  return result.data
}

export function parseQuery<T>(
  schema: z.ZodType<T>,
  input: unknown,
  reply: FastifyReply,
  requestId: string,
) {
  const result = schema.safeParse(input)

  if (!result.success) {
    void reply
      .status(400)
      .send(validationError(result.error.flatten(), requestId))
    return
  }

  return result.data
}
