# Error Handling

> How errors are handled in the current backend scaffold.

---

## Overview

The scaffold has two error boundaries today:

- request validation failures inside Fastify route handlers
- startup failures while parsing env or binding the server port

HTTP routes do not throw typed domain errors yet. Until service and repository layers exist, route handlers should either:

- return a schema-validated success envelope, or
- stop early through `parseBody()` after sending a validation error

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

---

## API Error Responses

### Validation & Failure Matrix

| Trigger | Status | Envelope | Notes |
|--------|--------|----------|-------|
| Body fails Zod validation | `400` | `validation_error` envelope | Sent by `parseBody()` |
| Route succeeds | `200` | success envelope | Includes `request_id` |
| Env parsing fails | startup crash | no HTTP response | Service does not start |
| `app.listen()` fails | startup crash | no HTTP response | Logged, then process exits |

### Current Rule

Do not send raw `{ error: ... }` objects from route handlers. All HTTP responses must use either:

- `success(...)`
- `validationError(...)`

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

### Common Mistake: Treat Startup Config Errors as Recoverable

**Symptom**: API or worker boots with half-valid configuration and fails later.

**Cause**: Direct `process.env` access bypassed Zod parsing.

**Fix**: Parse env once in `env.ts` and import the parsed object everywhere else.
