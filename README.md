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
- Fastify placeholder routes for world, session, and chat flows
- A Next.js landing shell that reflects the current platform plan
- A worker bootstrap that lists the async jobs planned by the product document

## What Is Intentionally Missing

- Real PostgreSQL, Redis, or Qdrant clients
- Provider adapters for LLM, search, or embeddings
- Persistent world/session storage
- Background queue orchestration

## Next Recommended Steps

1. Add persistence modules for worlds, sessions, memories, and outbox jobs.
2. Introduce a repository or service layer inside `apps/api`.
3. Wire the worker to Redis-backed queues and real job handlers.
4. Replace placeholder UI cards with the actual world builder, chat, and memory manager flows.
