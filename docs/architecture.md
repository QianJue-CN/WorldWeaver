# Architecture Notes

This scaffold follows the boundaries from `WordWeaverRPG开发文档.md`:

## Services

- `web`: player-facing and creator-facing UI for world building, chat, and memory management
- `api`: HTTP boundary for draft generation, world commit, sessions, chat, and memory editing
- `worker`: async processing entrypoint for extraction, summary, and embedding sync jobs

## Shared Packages

- `@worldweaver/contracts`: request and response schemas shared across web, api, and worker
- `@worldweaver/config`: service catalog, API route catalog, and worker job definitions

## Current API Surface

- `GET /api/health`
- `GET /api/bootstrap`
- `POST /api/worlds/drafts/generate`
- `POST /api/worlds/drafts/refine`
- `POST /api/worlds/commit`
- `POST /api/sessions`
- `POST /api/chat/send`

All write endpoints are scaffold placeholders that validate input and return deterministic demo payloads. They exist to lock the initial contract surface before persistence and provider integrations are added.
