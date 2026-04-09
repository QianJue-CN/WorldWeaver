import { z } from "zod"

export const createApiEnvelopeSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  z.object({
    code: z.number().int(),
    message: z.string(),
    data: dataSchema,
    request_id: z.string().min(1),
  })

export type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  request_id: string
}

export function apiSuccess<T>(
  data: T,
  requestId: string,
  message = "ok",
): ApiEnvelope<T> {
  return {
    code: 0,
    message,
    data,
    request_id: requestId,
  }
}
