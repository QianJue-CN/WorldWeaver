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
│       ├── lib/
│       │   ├── env.ts
│       │   ├── response.ts
│       │   └── validation.ts
│       ├── routes/
│       │   ├── bootstrap.ts
│       │   ├── health.ts
│       │   └── mvp.ts
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
- `apps/api/src/lib/validation.ts` shows the request-boundary validation helper
- `packages/contracts/src/mvp.ts` shows the shared source of truth for route payloads
- `packages/config/src/jobs.ts` shows shared worker job identifiers
