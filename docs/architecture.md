# Architecture Notes

This scaffold follows the boundaries from `WordWeaverRPG开发文档.md`:

## Services

- `web`: player-facing and creator-facing UI for world building, chat, and memory management
- `api`: HTTP boundary for draft generation, world commit, sessions, chat, and memory editing
- `worker`: async processing entrypoint for extraction, summary, and embedding sync jobs

## Shared Packages

- `@worldweaver/contracts`: request and response schemas shared across web, api, and worker
- `@worldweaver/config`: service catalog, API route catalog, worker job definitions, and provider metadata

## Current API Surface

- `GET /api/health`
- `GET /api/bootstrap`
- `POST /api/worlds/drafts/generate`
- `POST /api/worlds/drafts/refine`
- `POST /api/worlds/commit`
- `POST /api/sessions`
- `POST /api/chat/send`

The write endpoints now run through an API-local repository and service layer. For local development they persist draft, world, session, and chat state into a repo-local JSON store, validate referenced ids, and return deterministic but context-aware payloads. They still stop short of real PostgreSQL, Redis, Qdrant, or provider integrations.

Additional runtime surfaces now exist for player-scoped provider settings:

- `GET /api/provider-configs`
- `POST /api/provider-configs`
- `DELETE /api/provider-configs/:providerConfigId`

The API now supports these provider protocol families:

- OpenAI-compatible chat completions and embeddings
- Gemini `generateContent` and `embedContent`
- Anthropic `messages` for text generation

Embeddings are persisted locally today and used for similarity-based prompt retrieval inside the API service. Real Qdrant sync is still a future worker concern.
