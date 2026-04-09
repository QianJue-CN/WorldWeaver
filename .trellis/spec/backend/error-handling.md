# Error Handling

> How errors are handled in the current backend scaffold.

---

## Overview

The scaffold currently has four error boundaries:

- request validation failures inside Fastify route handlers
- domain-level missing-entity failures raised by the API service layer
- provider resolution or upstream provider failures raised by the AI integration layer
- startup failures while parsing env or binding the server port

Current API routes may now either:

- return a schema-validated success envelope, or
- stop early through `parseBody()` after sending a validation error, or
- translate a typed `ApiRouteError` into a standard failure envelope

For any API contract change, read `http-contracts.md` together with this file.

---

## Error Types

### Validation Error Envelope

Validation failures use this exact shape:

```ts
{
  code: 400,
  message: "validation_error",
  data: { issues },
  request_id: string
}
```

The envelope is created by `validationError()` in `apps/api/src/lib/response.ts`.

### Domain Failure Envelope

Missing-entity failures currently use this shape:

```ts
{
  code: 404,
  message: "draft_not_found" | "world_not_found" | "session_not_found",
  data: {
    entity: "draft" | "world" | "session",
    id: string
  },
  request_id: string
}
```

Routes build this envelope through `failure()` after catching `ApiRouteError`.

### Provider Failure Envelope

Provider integration currently returns these additional error codes:

- `provider_config_not_found`
- `provider_capability_unavailable`
- `provider_not_configured`
- `provider_request_failed`
- `provider_response_invalid`

They still use the standard failure envelope and may return `400`, `502`, or `503` depending on the failure source.

### Startup Failure

- API startup logs the error with `app.log.error(error)` and exits with `process.exit(1)`
- API and worker env parsing use `z.object(...).parse(process.env)`, so invalid values fail fast during startup

---

## Error Handling Patterns

### Pattern: Validate at the HTTP Boundary

```ts
const body = parseBody(schema, request.body, reply, request.id)

if (!body) {
  return
}
```

Why:

- request validation happens once at the entry point
- route code after the guard receives typed data
- every validation failure uses the same envelope shape

### Pattern: Parse Success Payloads Before Returning

Even scaffold placeholders are parsed with the matching response schema before calling `success()`.

```ts
const data = commitWorldResponseSchema.parse({
  world_id: `world_${slugify(body.world_name)}`,
  status: "processing",
  queued_jobs: ["draft_commit_extraction", "embedding_sync"],
})

return success(data, request.id, "queued")
```

Why:

- the response contract stays aligned with `packages/contracts`
- placeholder logic cannot silently drift from the shared API shape

### Pattern: Throw Typed Route Errors From Services

```ts
const draft = state.drafts[input.draft_id]

if (!draft) {
  throw notFoundError("draft", input.draft_id)
}
```

Why:

- repository and service code express domain failures once
- routes can translate those failures into a consistent envelope
- missing references no longer silently create fake state

---

## API Error Responses

### Validation & Failure Matrix

| Trigger | Status | Envelope | Notes |
|--------|--------|----------|-------|
| Body fails Zod validation | `400` | `validation_error` envelope | Sent by `parseBody()` |
| Service cannot find referenced draft/world/session | `404` | standard failure envelope | Sent after catching `ApiRouteError` |
| Provider config id is unknown | `400` | standard failure envelope | Includes provider id metadata |
| Provider format lacks embeddings, such as Anthropic today | `400` | standard failure envelope | Returned when embedding capability is required |
| Provider credentials are missing | `503` | standard failure envelope | For example built-in OpenAI without `OPENAI_API_KEY` |
| Upstream provider request or response is invalid | `502` | standard failure envelope | Returned by protocol clients |
| Route succeeds | `200` | success envelope | Includes `request_id` |
| Env parsing fails | startup crash | no HTTP response | Service does not start |
| `app.listen()` fails | startup crash | no HTTP response | Logged, then process exits |

### Current Rule

Do not send raw `{ error: ... }` objects from route handlers. All HTTP responses must use either:

- `success(...)`
- `validationError(...)`
- `failure(...)`

---

## Common Mistakes

### Common Mistake: Continue After `parseBody()` Fails

**Symptom**: Route code tries to read fields from an undefined `body`.

**Cause**: The route forgot to return after `parseBody()` already sent the error response.

**Fix**:

```ts
if (!body) {
  return
}
```

**Prevention**: Keep the validation guard at the top of every mutating route.

### Common Mistake: Define Ad-Hoc Error Shapes

**Symptom**: Different routes return different error payloads for the same validation problem.

**Cause**: A route bypassed `validationError()` or `success()`.

**Fix**: Reuse the helpers in `apps/api/src/lib/response.ts`.

### Common Mistake: Hide Missing References Behind Placeholder Data

**Symptom**: Refine, commit, session, or chat routes appear to succeed even when the referenced id was never created.

**Cause**: Business logic stayed inline in the route and skipped repository-backed validation.

**Fix**: Validate references in the service layer and throw `ApiRouteError` when the entity is missing.

### Common Mistake: Leak Provider Secrets Into Errors Or Logs

**Symptom**: Errors or logs include raw API keys or full provider payloads.

**Cause**: Provider adapters or settings routes return raw request configuration directly.

**Fix**: Persist raw keys server-side only, return masked previews to the UI, and keep provider failure envelopes limited to non-secret metadata.

### Common Mistake: Treat Startup Config Errors as Recoverable

**Symptom**: API or worker boots with half-valid configuration and fails later.

**Cause**: Direct `process.env` access bypassed Zod parsing.

**Fix**: Parse env once in `env.ts` and import the parsed object everywhere else.
