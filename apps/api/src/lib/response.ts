import { apiSuccess } from "@worldweaver/contracts"

export function success<T>(data: T, requestId: string, message = "ok") {
  return apiSuccess(data, requestId, message)
}

export function failure(
  statusCode: number,
  message: string,
  requestId: string,
  data: unknown = {},
) {
  return {
    code: statusCode,
    message,
    data,
    request_id: requestId,
  }
}

export function validationError(issues: unknown, requestId: string) {
  return failure(400, "validation_error", requestId, { issues })
}
