import { apiSuccess } from "@worldweaver/contracts"

export function success<T>(data: T, requestId: string, message = "ok") {
  return apiSuccess(data, requestId, message)
}

export function validationError(issues: unknown, requestId: string) {
  return {
    code: 400,
    message: "validation_error",
    data: { issues },
    request_id: requestId,
  }
}
