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
- `packages/contracts/src/bootstrap.ts`
- `packages/contracts/src/mvp.ts`
- `packages/config/src/api-copy.ts`
- `packages/config/src/env.ts`
- `packages/config/src/i18n.ts`
- `packages/config/src/runtime-env.ts`
- `packages/config/src/jobs.ts`
- `packages/config/src/providers.ts`
- `apps/api/src/lib/response.ts`
- `apps/api/src/lib/locale.ts`
- `apps/api/src/lib/env.ts`
- `apps/api/src/lib/services.ts`
- `apps/api/src/lib/validation.ts`
- `apps/api/src/ai/*.ts`
- `apps/api/src/routes/health.ts`
- `apps/api/src/routes/bootstrap.ts`
- `apps/api/src/routes/mvp.ts`
- `apps/api/src/routes/provider-configs.ts`
- `apps/api/src/services/provider-config-service.ts`
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
| `GET` | `/api/provider-configs` | `apps/api/src/routes/provider-configs.ts` |
| `POST` | `/api/provider-configs` | `apps/api/src/routes/provider-configs.ts` |
| `DELETE` | `/api/provider-configs/:providerConfigId` | `apps/api/src/routes/provider-configs.ts` |
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

Service-level missing reference failures use:

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

#### Shared Request and Response Schemas

| Endpoint | Request Source | Response Source |
|---------|----------------|-----------------|
| `/api/bootstrap` | `bootstrapCatalogQuerySchema` | `bootstrapCatalogResponseSchema` |
| `/api/provider-configs` `GET` | `providerConfigListQuerySchema` | `providerConfigListResponseSchema` |
| `/api/provider-configs` `POST` | `upsertProviderConfigRequestSchema` | `savedProviderConfigSchema` |
| `/api/provider-configs/:providerConfigId` `DELETE` | `deleteProviderConfigParamsSchema` + `providerConfigListQuerySchema` | `deleteProviderConfigResponseSchema` |
| `/api/worlds/drafts/generate` | `draftGenerateRequestSchema` | `draftGenerateResponseSchema` |
| `/api/worlds/drafts/refine` | `draftRefineRequestSchema` | `draftRefineResponseSchema` |
| `/api/worlds/commit` | `commitWorldRequestSchema` | `commitWorldResponseSchema` |
| `/api/sessions` | `createSessionRequestSchema` | `createSessionResponseSchema` |
| `/api/chat/send` | `chatSendRequestSchema` | `chatSendResponseSchema` |

#### Locale Negotiation

Current scaffold locale resolution lives in `packages/config/src/i18n.ts` and `apps/api/src/lib/locale.ts`.

Supported locales:

- `en`
- `zh-CN`

Request boundaries:

- `/api/bootstrap` accepts optional query `locale`
- all API routes may also receive `X-WorldWeaver-Locale`
- when explicit locale is missing, the API may fall back to `Accept-Language`
- invalid or unknown locale input resolves to default locale `en`

Priority order:

1. explicit route-level locale input such as `/api/bootstrap?locale=zh-CN`
2. `X-WorldWeaver-Locale`
3. `Accept-Language`
4. default locale `en`

#### Locale-Aware Scaffold Content

Locale-aware scaffold strings live in `packages/config/src/api-copy.ts`.

These include:

- success envelope messages such as `ok`, `queued`, and `created`
- draft placeholder text and outline items
- refinement placeholder text
- default localized session title
- placeholder assistant reply
 - provider settings panel copy for the web console

The API must not hardcode route-local user-facing scaffold strings directly inside route handlers.

#### Environment Keys

| Key | Parsed In | Default Source |
|-----|-----------|----------------|
| `API_HOST` | `apps/api/src/lib/env.ts` | `packages/config/src/env.ts` |
| `API_PORT` | `apps/api/src/lib/env.ts` | `packages/config/src/env.ts` |
| `API_ALLOWED_ORIGINS` | `apps/api/src/lib/env.ts` | `packages/config/src/env.ts` |
| `POSTGRES_URL` | API and worker env modules | `packages/config/src/env.ts` |
| `REDIS_URL` | API and worker env modules | `packages/config/src/env.ts` |
| `QDRANT_URL` | API and worker env modules | `packages/config/src/env.ts` |
| `OPENAI_API_KEY` | `apps/api/src/lib/env.ts` | environment only |
| `OPENAI_BASE_URL` | `apps/api/src/lib/env.ts` | `packages/config/src/providers.ts` |
| `OPENAI_TEXT_MODEL` | `apps/api/src/lib/env.ts` | `packages/config/src/providers.ts` |
| `OPENAI_EMBEDDING_MODEL` | `apps/api/src/lib/env.ts` | `packages/config/src/providers.ts` |
| `OPENAI_TIMEOUT_MS` | `apps/api/src/lib/env.ts` | `packages/config/src/providers.ts` |
| `OPENAI_ORGANIZATION` | `apps/api/src/lib/env.ts` | environment only |
| `OPENAI_PROJECT` | `apps/api/src/lib/env.ts` | environment only |
| `OPENAI_EMBEDDING_DIMENSIONS` | `apps/api/src/lib/env.ts` | environment only |
| `MOCK_EMBEDDING_DIMENSIONS` | `apps/api/src/lib/env.ts` | `packages/config/src/providers.ts` |
| `WORKER_NAME` | `apps/worker/src/env.ts` | `packages/config/src/env.ts` |
| `WORKER_HEARTBEAT_MS` | `apps/worker/src/env.ts` | `packages/config/src/env.ts` |

#### Runtime Env Loading

For local non-production runtime startup:

- `packages/config/src/runtime-env.ts` loads repo-root `.env.local` first
- missing keys then fall back to repo-root `.env`
- existing shell env values still win over file-based values
- `apps/api/src/lib/env.ts` and `apps/worker/src/env.ts` must call `loadLocalRuntimeEnv(import.meta.url)` before `envSchema.parse(process.env)`

This keeps `pnpm dev:api`, `pnpm dev:worker`, and `pnpm dev:web` aligned on the same local environment contract.

#### Worker Job IDs Returned by API

- `worldCommitJobIds`
  - `draft_commit_extraction`
  - `embedding_sync`
- `sessionUpdateJobIds`
  - `session_memory_extraction`
  - `session_summary`

These live in `packages/config/src/jobs.ts` and must stay synchronized with any API payload that returns `queued_jobs`.

#### Provider Protocol Families

The API currently supports these runtime protocol families:

- OpenAI-compatible `chat/completions` and `embeddings`
- Gemini `generateContent` and `embedContent`
- Anthropic `v1/messages` for text generation
- Local mock provider for deterministic development and tests

Anthropic is currently text-only in this repository. If embeddings are required for a provider config, the format must be OpenAI-compatible, Gemini, or mock.

### 4. Validation & Error Matrix

| Trigger | Boundary | Expected Outcome |
|--------|----------|------------------|
| `/api/bootstrap?locale=zh-CN` | `bootstrapCatalogQuerySchema` + `getRequestLocale()` | Returns Chinese `project_name`, service summaries, route purposes, job triggers, and success message |
| `X-WorldWeaver-Locale: zh-CN` on scaffold route | `getRequestLocale()` | Returns Chinese scaffold payload and success envelope message |
| No locale query or locale header | `resolveLocale()` | Route falls back to default locale `en` |
| Unknown locale such as `fr-FR` | `resolveLocale()` | Route falls back to `en` instead of throwing |
| `.env.local` contains a local override such as `POSTGRES_URL` | `loadLocalRuntimeEnv()` | API and worker use the `.env.local` value during local startup |
| `.env.local` omits a key but `.env` contains it | `loadLocalRuntimeEnv()` | Startup falls back to the `.env` value |
| Shell env already defines a key such as `API_PORT` | `loadEnvFile()` behavior | Existing `process.env` value stays unchanged |
| Valid request body | `parseBody()` | Route continues with typed `body` |
| Valid query such as `locale=zh-CN` | `parseQuery()` | Route continues with typed `query` |
| Invalid query such as `locale=jp` | `parseQuery()` | HTTP `400` with `message: "validation_error"` and flattened `issues` |
| Invalid request body | `parseBody()` | HTTP `400` with `message: "validation_error"` and flattened `issues` |
| Valid provider settings query with `owner_id=player_local` | `providerConfigListQuerySchema` | Returns built-in configs plus player-scoped saved configs |
| Invalid provider config id in generation flow | `ProviderRegistry` | HTTP `400` with `message: "provider_config_not_found"` |
| Anthropic config requests embeddings | `ProviderRegistry` | HTTP `400` with `message: "provider_capability_unavailable"` |
| Built-in OpenAI config without key | `ProviderRegistry` | HTTP `503` with `message: "provider_not_configured"` |
| Upstream provider rejects request | protocol client | HTTP `502` with `message: "provider_request_failed"` |
| Upstream provider returns malformed body | protocol client or `AiGateway` | HTTP `502` with `message: "provider_response_invalid"` |
| Missing optional field `title` in session create | `createSessionRequestSchema` + locale-aware copy | Accepted, route uses localized fallback title such as `"New Session"` or `"新会话"` |
| Unknown `draft_id` on refine or commit | `MvpService` + `ApiRouteError` | HTTP `404` with entity metadata in the failure envelope |
| Unknown `world_id` on session create | `MvpService` + `ApiRouteError` | HTTP `404` with entity metadata in the failure envelope |
| Unknown `session_id` on chat send | `MvpService` + `ApiRouteError` | HTTP `404` with entity metadata in the failure envelope |
| Invalid env type such as non-numeric `API_PORT` | `envSchema.parse(process.env)` | Startup throws before service begins listening |
| Successful route handler | `success()` helper | HTTP `200` with envelope containing `request_id` |
| Fastify startup failure | `start()` catch in `server.ts` | `app.log.error(error)` then `process.exit(1)` |

### 5. Good / Base / Bad Cases

#### Good

- Add a new locale-aware scaffold string in `packages/config/src/api-copy.ts`
- Resolve request locale once in the route through `getRequestLocale(request, query?.locale)`
- Parse route query through `parseQuery()` when locale is accepted on query string
- Parse localized response payload with the matching schema before returning
- Resolve `provider_config_id` through the provider registry instead of branching directly in services
- Persist raw provider keys server-side but return masked previews to the UI
- Keep `queued_jobs` arrays sourced from `worldCommitJobIds` or `sessionUpdateJobIds`
- Validate referenced entities in the service layer before mutating persisted state
- Add a new request field in `packages/contracts/src/mvp.ts`
- Import that schema into `apps/api/src/routes/*.ts`
- Validate through `parseBody()`
- Return through `success()`
- Load local runtime env once from `apps/api/src/lib/env.ts` or `apps/worker/src/env.ts`
- Keep local overrides in repo-root `.env.local` instead of duplicating connection strings in app code

#### Base

- A scaffold endpoint may return placeholder data
- Placeholder data may vary by locale
- Placeholder data must still be parsed by the matching response schema before returning
- Local development persistence may use an API-local JSON store before PostgreSQL exists
- Player-scoped provider configs may be stored in the local API state file during local development
- API and worker may use shared defaults from `packages/config/src/env.ts` when neither `.env.local` nor `.env` provides a key

#### Bad

- Hardcode user-facing scaffold copy directly in `apps/api/src/routes/*.ts`
- Return success for refine, commit, session, or chat routes without verifying the referenced id exists
- Put raw provider secrets in frontend-readable responses
- Hardcode OpenAI, Gemini, or Anthropic HTTP payloads inside routes or domain services
- Read locale headers ad hoc in each route instead of using `apps/api/src/lib/locale.ts`
- Accept query input on `/api/bootstrap` without validating it through `bootstrapCatalogQuerySchema`
- Define route-local payload types in `apps/api/src/routes/*.ts`
- Return raw JSON without `success()`
- Duplicate shared defaults in `apps/api/src/lib/env.ts` and `apps/worker/src/env.ts`
- Add a new worker job id in the route handler without updating `packages/config/src/jobs.ts`
- Read repo-root env files ad hoc from multiple services instead of reusing `packages/config/src/runtime-env.ts`
- Parse `process.env` before calling `loadLocalRuntimeEnv(import.meta.url)` in API or worker env modules

### 6. Tests Required

At scaffold stage, every contract change must still pass:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

When automated route tests are added, assert at least:

- `/api/bootstrap?locale=en` and `/api/bootstrap?locale=zh-CN` both return schema-valid data
- scaffold route responses change localized copy when `X-WorldWeaver-Locale` changes
- invalid bootstrap locale query returns HTTP `400`
- valid bodies reach the success path
- invalid bodies return HTTP `400`
- all success responses include `request_id`
- response `data` matches the shared response schema
- `queued_jobs` only contains ids defined in `packages/config/src/jobs.ts`
- env parsing rejects invalid numeric configuration
- API and worker both honor repo-root `.env.local` overrides during local startup

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
app.get("/bootstrap", async (request, reply) => {
  const query = parseQuery(
    bootstrapCatalogQuerySchema,
    request.query,
    reply,
    request.id,
  )

  if (!query) {
    return
  }

  const locale = getRequestLocale(request, query.locale)
  const copy = getApiScaffoldCopy(locale)

  const data = bootstrapCatalogResponseSchema.parse({
    ...getBootstrapSummary(locale),
    api_routes: getApiRouteCatalog(locale),
    provider_configs: providerRegistry.listSystemProviderDescriptors(locale),
    worker_jobs: getWorkerJobCatalog(locale),
  })

  return success(data, request.id, copy.envelopeMessages.ok)
})
```

```ts
app.post("/worlds/commit", async (request, reply) => {
  const locale = getRequestLocale(request)
  const copy = getApiScaffoldCopy(locale)

  const body = parseBody(
    commitWorldRequestSchema,
    request.body,
    reply,
    request.id,
  )

  if (!body) {
    return
  }

  const data = commitWorldResponseSchema.parse({
    world_id: `world_${slugify(body.world_name)}`,
    status: "processing",
    queued_jobs: ["draft_commit_extraction", "embedding_sync"],
  })

  return success(data, request.id, copy.envelopeMessages.queued)
})
```

```ts
app.post("/chat/send", async (request, reply) => {
  const locale = getRequestLocale(request)
  const copy = getApiScaffoldCopy(locale)
  const body = parseBody(chatSendRequestSchema, request.body, reply, request.id)

  if (!body) {
    return
  }

  try {
    const data = chatSendResponseSchema.parse(
      await mvpService.sendChat(body, locale),
    )

    return success(data, request.id, copy.envelopeMessages.scaffolded)
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return reply
        .status(error.statusCode)
        .send(failure(error.statusCode, error.code, request.id, error.details))
    }

    throw error
  }
})
```

The correct pattern keeps schema definition, runtime validation, and response wrapping aligned across all layers.
