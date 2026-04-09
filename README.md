# WorldWeaver RPG

WorldWeaver RPG is a long-context role-playing platform scaffolded from the product document in [WordWeaverRPG开发文档.md](./WordWeaverRPG开发文档.md).

## Workspace Layout

```text
apps/
  api/      Fastify JSON API scaffold
  web/      Next.js App Router shell
  worker/   Async pipeline placeholder worker
packages/
  config/   Shared service metadata and job catalogs
  contracts/ Shared Zod schemas and response envelopes
docs/
  architecture.md
  development-roadmap.md
```

## Quick Start

```bash
pnpm install
pnpm check
pnpm dev:web
pnpm dev:api
pnpm dev:worker
```

Shared packages compile to `dist/` before each app dev command. If you change code under `packages/`, rerun the relevant `pnpm dev:*` command or `pnpm build:shared`.

For local development, `apps/web`, `apps/api`, and `apps/worker` all read the repo-root `.env.local` first, then fall back to `.env` when a key is missing.

## What Exists Today

- A monorepo aligned to the documented service boundaries
- Shared contracts for the first MVP API surface
- A stateful Fastify local MVP backend with persisted draft, world, session, and chat flow records
- Player-scoped provider settings APIs and UI for OpenAI-compatible, Gemini, and Anthropic-style services
- Real provider adapters for text generation plus embedding generation for OpenAI-compatible and Gemini services
- Local vector persistence and similarity retrieval used during chat generation
- A Next.js landing shell that reflects the current platform plan
- A worker bootstrap that lists the async jobs planned by the product document
- API service and repository layers that keep lifecycle logic out of route handlers
- Automated API service tests covering local persistence and missing-entity failures

## What Is Intentionally Missing

- Real PostgreSQL, Redis, or Qdrant clients
- Search-provider integration
- Background queue orchestration
- Real worker-side embedding sync execution and retry orchestration

## Next Recommended Steps

1. Replace the JSON-backed local repository with PostgreSQL-backed persistence for worlds, sessions, memories, and outbox jobs.
2. Move embedding generation and retry handling from API-side best effort into the worker queue.
3. Add memory CRUD and retrieval endpoints on top of the persisted lifecycle data.
4. Expand the settings UI to support search providers, richer validation, and secret management.

For a more explicit follow-up backlog and phased development plan, see [docs/development-roadmap.md](./docs/development-roadmap.md).
