# Directory Structure

> How backend code is organized in this project.

---

## Overview

WorldWeaver backend code is split between executable services in `apps/` and reusable cross-layer contracts in `packages/`.

Backend work currently touches four locations:

- `apps/api` for Fastify route registration and HTTP-only helpers
- `apps/worker` for async bootstrap and worker-only env parsing
- `packages/contracts` for shared request and response schemas
- `packages/config` for shared defaults, job catalogs, and service metadata

---

## Directory Layout

```text
apps/
├── api/
│   └── src/
│       ├── ai/
│       │   ├── ai-gateway.ts
│       │   ├── anthropic-client.ts
│       │   ├── gemini-client.ts
│       │   ├── mock-client.ts
│       │   ├── openai-compatible-client.ts
│       │   ├── prompts.ts
│       │   ├── provider-clients.test.ts
│       │   ├── provider-registry.ts
│       │   └── retrieval.ts
│       ├── lib/
│       │   ├── api-error.ts
│       │   ├── env.ts
│       │   ├── response.ts
│       │   ├── services.ts
│       │   └── validation.ts
│       ├── repositories/
│       │   └── local-state.ts
│       ├── routes/
│       │   ├── bootstrap.ts
│       │   ├── health.ts
│       │   ├── mvp.ts
│       │   └── provider-configs.ts
│       ├── services/
│       │   ├── mvp-service.test.ts
│       │   ├── mvp-service.ts
│       │   ├── provider-config-service.test.ts
│       │   └── provider-config-service.ts
│       └── server.ts
└── worker/
    └── src/
        ├── env.ts
        └── index.ts

packages/
├── config/
│   └── src/
│       ├── env.ts
│       ├── jobs.ts
│       ├── services.ts
│       └── index.ts
└── contracts/
    └── src/
        ├── common/
        │   └── api-envelope.ts
        ├── bootstrap.ts
        ├── mvp.ts
        └── index.ts
```

---

## Module Organization

### Rule: Contract First, Runtime Second

When a change affects HTTP payloads or worker-visible identifiers, update files in this order:

1. `packages/contracts` for request/response schemas
2. `packages/config` for shared defaults, catalogs, or job ids
3. `apps/api` or `apps/worker` for runtime behavior

### Rule: Keep Runtime-Specific Code Inside the App

- Fastify-only code belongs in `apps/api/src`
- Worker boot or polling logic belongs in `apps/worker/src`
- Cross-layer schemas must not live inside `apps/api/src/routes`

### Rule: Thin Routes, Stateful Services

- Route files should parse input, resolve locale, call a service, and wrap the result.
- Business lifecycle logic belongs in `apps/api/src/services`.
- Local persistence adapters belong in `apps/api/src/repositories`.
- Route-facing domain errors belong in `apps/api/src/lib/api-error.ts`.

### Rule: Protocol Adapters Live Under `ai/`

- Provider protocol clients belong in `apps/api/src/ai`.
- Prompt builders and retrieval helpers also belong in `apps/api/src/ai`.
- Route handlers and domain services must not handcraft OpenAI, Gemini, or Anthropic request payloads inline.

### Rule: Put Shared Defaults in One Place

Defaults shared by API and worker, such as local connection strings, belong in `packages/config/src/env.ts`.

---

## Naming Conventions

- Route files use lowercase names by domain, for example `health.ts` and `mvp.ts`
- Fastify plugins export a `*Routes` constant, for example `healthRoutes`
- Local helper modules use lowercase file names such as `env.ts` and `response.ts`
- Local ESM imports use the `.js` extension
- Environment variable names remain uppercase and are parsed once in `env.ts`

---

## Examples

- `apps/api/src/routes/mvp.ts` shows route registration that consumes shared schemas
- `apps/api/src/routes/provider-configs.ts` shows player-scoped settings CRUD at the HTTP boundary
- `apps/api/src/lib/validation.ts` shows the request-boundary validation helper
- `apps/api/src/services/mvp-service.ts` shows the current service-layer lifecycle orchestration
- `apps/api/src/services/provider-config-service.ts` shows player provider settings orchestration
- `apps/api/src/repositories/local-state.ts` shows the local persistence adapter used in development
- `apps/api/src/ai/provider-registry.ts` shows provider resolution across built-in and player-scoped configs
- `packages/contracts/src/mvp.ts` shows the shared source of truth for route payloads
- `packages/config/src/jobs.ts` shows shared worker job identifiers
