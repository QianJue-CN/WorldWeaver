# HTTP Contracts

> Executable contracts for the current scaffold across web, api, worker, and shared packages.

---

## Overview

This file is the required spec for any change that touches:

- HTTP request or response payloads
- response envelopes
- environment variables shared by API and worker
- worker job ids consumed by the API or frontend

The current scaffold keeps cross-layer contracts in `packages/contracts` and shared defaults or catalogs in `packages/config`.

---

## Scenario: Scaffold HTTP and Worker Boundary

### 1. Scope / Trigger

- Trigger: add or change an API endpoint
- Trigger: change a request field, response field, or response envelope
- Trigger: add or rename a worker job id returned by an endpoint
- Trigger: add or change an env key parsed by API or worker

### 2. Signatures

#### Files

- `packages/contracts/src/common/api-envelope.ts`
- `packages/contracts/src/mvp.ts`
- `packages/config/src/env.ts`
- `packages/config/src/jobs.ts`
- `apps/api/src/lib/response.ts`
- `apps/api/src/lib/validation.ts`
- `apps/api/src/routes/health.ts`
- `apps/api/src/routes/bootstrap.ts`
- `apps/api/src/routes/mvp.ts`
- `apps/worker/src/env.ts`

#### Commands

```bash
pnpm lint
pnpm typecheck
pnpm build
```

#### Route Surface

| Method | Path | Source File |
|-------|------|-------------|
| `GET` | `/api/health` | `apps/api/src/routes/health.ts` |
| `GET` | `/api/bootstrap` | `apps/api/src/routes/bootstrap.ts` |
| `POST` | `/api/worlds/drafts/generate` | `apps/api/src/routes/mvp.ts` |
| `POST` | `/api/worlds/drafts/refine` | `apps/api/src/routes/mvp.ts` |
| `POST` | `/api/worlds/commit` | `apps/api/src/routes/mvp.ts` |
| `POST` | `/api/sessions` | `apps/api/src/routes/mvp.ts` |
| `POST` | `/api/chat/send` | `apps/api/src/routes/mvp.ts` |

### 3. Contracts

#### Response Envelope

All successful API responses use this shape:

```ts
type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  request_id: string
}
```

Success responses are created with `success(data, request.id, message)` and currently return `code: 0`.

Validation failures use:

```ts
{
  code: 400,
  message: "validation_error",
  data: { issues },
  request_id: string
}
```

#### Shared Request and Response Schemas

| Endpoint | Request Source | Response Source |
|---------|----------------|-----------------|
| `/api/worlds/drafts/generate` | `draftGenerateRequestSchema` | `draftGenerateResponseSchema` |
| `/api/worlds/drafts/refine` | `draftRefineRequestSchema` | `draftRefineResponseSchema` |
| `/api/worlds/commit` | `commitWorldRequestSchema` | `commitWorldResponseSchema` |
| `/api/sessions` | `createSessionRequestSchema` | `createSessionResponseSchema` |
| `/api/chat/send` | `chatSendRequestSchema` | `chatSendResponseSchema` |

#### Environment Keys

| Key | Parsed In | Default Source |
|-----|-----------|----------------|
| `API_HOST` | `apps/api/src/lib/env.ts` | `packages/config/src/env.ts` |
| `API_PORT` | `apps/api/src/lib/env.ts` | `packages/config/src/env.ts` |
| `API_ALLOWED_ORIGINS` | `apps/api/src/lib/env.ts` | `packages/config/src/env.ts` |
| `POSTGRES_URL` | API and worker env modules | `packages/config/src/env.ts` |
| `REDIS_URL` | API and worker env modules | `packages/config/src/env.ts` |
| `QDRANT_URL` | API and worker env modules | `packages/config/src/env.ts` |
| `WORKER_NAME` | `apps/worker/src/env.ts` | `packages/config/src/env.ts` |
| `WORKER_HEARTBEAT_MS` | `apps/worker/src/env.ts` | `packages/config/src/env.ts` |

#### Worker Job IDs Returned by API

- `draft_commit_extraction`
- `embedding_sync`
- `session_memory_extraction`
- `session_summary`

These live in `packages/config/src/jobs.ts` and must stay synchronized with any API payload that returns `queued_jobs`.

### 4. Validation & Error Matrix

| Trigger | Boundary | Expected Outcome |
|--------|----------|------------------|
| Valid request body | `parseBody()` | Route continues with typed `body` |
| Invalid request body | `parseBody()` | HTTP `400` with `message: "validation_error"` and flattened `issues` |
| Missing optional field `title` in session create | `createSessionRequestSchema` | Accepted, route uses `"New Session"` fallback |
| Invalid env type such as non-numeric `API_PORT` | `envSchema.parse(process.env)` | Startup throws before service begins listening |
| Successful route handler | `success()` helper | HTTP `200` with envelope containing `request_id` |
| Fastify startup failure | `start()` catch in `server.ts` | `app.log.error(error)` then `process.exit(1)` |

### 5. Good / Base / Bad Cases

#### Good

- Add a new request field in `packages/contracts/src/mvp.ts`
- Import that schema into `apps/api/src/routes/*.ts`
- Validate through `parseBody()`
- Return through `success()`

#### Base

- A scaffold endpoint may return placeholder data
- Placeholder data must still be parsed by the matching response schema before returning

#### Bad

- Define route-local payload types in `apps/api/src/routes/*.ts`
- Return raw JSON without `success()`
- Duplicate shared defaults in `apps/api/src/lib/env.ts` and `apps/worker/src/env.ts`
- Add a new worker job id in the route handler without updating `packages/config/src/jobs.ts`

### 6. Tests Required

At scaffold stage, every contract change must still pass:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

When automated route tests are added, assert at least:

- valid bodies reach the success path
- invalid bodies return HTTP `400`
- all success responses include `request_id`
- response `data` matches the shared response schema
- `queued_jobs` only contains ids defined in `packages/config/src/jobs.ts`
- env parsing rejects invalid numeric configuration

### 7. Wrong vs Correct

#### Wrong

```ts
app.post("/api/example", async (request) => {
  const body = request.body as { draft_id: string }

  return {
    draft_id: body.draft_id,
  }
})
```

#### Correct

```ts
app.post("/worlds/commit", async (request, reply) => {
  const body = parseBody(commitWorldRequestSchema, request.body, reply, request.id)

  if (!body) {
    return
  }

  const data = commitWorldResponseSchema.parse({
    world_id: `world_${slugify(body.world_name)}`,
    status: "processing",
    queued_jobs: ["draft_commit_extraction", "embedding_sync"],
  })

  return success(data, request.id, "queued")
})
```

The correct pattern keeps schema definition, runtime validation, and response wrapping aligned across all layers.
