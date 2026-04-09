# Continue Overall Development

## Goal

Turn the current placeholder-only MVP API into a stateful local development backend so the documented draft -> world -> session -> chat flow can persist and validate real entities instead of fabricating independent demo responses on every request.

## What I Already Know

* The project history shows three completed milestones: scaffold initialization, a local web control center MVP, and bilingual i18n across the stack.
* `README.md` explicitly lists the next recommended steps as persistence modules first, then a repository or service layer in `apps/api`.
* `docs/architecture.md` says the current write endpoints intentionally validate input and return deterministic placeholder payloads only.
* `apps/api/src/routes/mvp.ts` currently generates every draft, world, session, and chat response inline without any stored state.
* `apps/web` already exercises the full local flow through those endpoints, so improving backend behavior can unlock the next development stage without redesigning the UI first.
* Shared HTTP schemas already live in `packages/contracts`, and locale-aware scaffold copy plus worker job catalogs already live in `packages/config`.

## Assumptions (Temporary)

* The highest-value next milestone is backend statefulness, not another frontend redesign.
* We should preserve the current public API surface and response schemas unless implementation reveals a hard blocker.
* Because real PostgreSQL, Redis, and Qdrant integrations are intentionally out of scope today, a repo-local development store is the right bridge layer for now.

## Open Questions

* No blocking questions after repo and history inspection. Proceed with a backend-first local persistence slice unless a hidden contract issue appears.

## Requirements

* Add a local persistence module inside `apps/api` that stores draft, world, session, and chat state for local development.
* Introduce an API service layer so route handlers stop embedding all business logic directly in `apps/api/src/routes/mvp.ts`.
* Keep existing shared request and response contracts valid for the current web control center.
* Validate referenced entities during refine, commit, session creation, and chat send flows instead of accepting arbitrary ids.
* Persist draft revisions, committed world metadata, sessions, and chat messages in a shape that can support later PostgreSQL and worker integration.
* Generate deterministic assistant replies from stored world and session context so chat behavior reflects prior state more than a fixed placeholder string.
* Keep locale-aware success messaging and queued job ids synchronized with shared config.
* Add automated backend tests for the new persistence and service behavior.
* Update Trellis backend specs when new structural or error-handling patterns are introduced.

## Acceptance Criteria

* [ ] `POST /api/worlds/drafts/generate` creates and persists a draft record that later routes can reference.
* [ ] `POST /api/worlds/drafts/refine` rejects unknown draft ids and persists a new revision for known drafts.
* [ ] `POST /api/worlds/commit` rejects unknown draft ids and stores a world tied to the committed draft.
* [ ] `POST /api/sessions` rejects unknown world ids and stores a new session for valid worlds.
* [ ] `POST /api/chat/send` rejects unknown session ids, persists both user and assistant turns, and returns a context-aware assistant message.
* [ ] Route handlers delegate lifecycle work to a service layer rather than constructing all responses inline.
* [ ] Automated tests cover the valid path plus the main missing-entity failure cases.
* [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.

## Definition Of Done

* Backend behavior is stateful enough to support the current local control-center flow.
* Shared contracts remain the public source of truth for HTTP payloads.
* New backend structure and error patterns are documented in Trellis specs.
* Verification commands pass before handoff.

## Technical Approach

Create an API-local repository layer backed by a repo-root JSON state file under `.tmp/`, then add an application service that owns draft generation, refinement, world commit, session creation, and chat turn persistence. Routes will remain thin: parse request input, resolve locale, call the service, parse the returned response payload with shared contracts, and wrap it in the standard envelope. Missing-entity cases will use a shared API error helper so failure handling stays consistent.

## Decision (ADR-lite)

**Context**: The project already has a frontend MVP and localized contracts, but the backend still returns isolated placeholder payloads that do not advance the product toward the documented world/session/memory lifecycle.

**Decision**: Implement a local persistence and service layer inside `apps/api` while preserving the current external API surface.

**Consequences**: This moves the project from demo-only responses toward a reusable backend core, at the cost of adding temporary JSON-backed persistence that will later need replacement by PostgreSQL and worker integrations.

## Out Of Scope

* Real PostgreSQL, Redis, or Qdrant clients
* Real LLM, search, or embedding provider integrations
* New frontend information architecture or major visual redesign
* Memory CRUD endpoints and worker execution

## Technical Notes

* Historical task trail:
  * scaffold initialization established shared contracts and specs
  * continue-web-development built the local control center
  * continue-web-bilingual-i18n made contracts and UI locale-aware
* Relevant docs:
  * `README.md`
  * `docs/architecture.md`
  * `WordWeaverRPG开发文档.md`
  * `.trellis/spec/backend/http-contracts.md`
  * `.trellis/spec/backend/directory-structure.md`
  * `.trellis/spec/backend/error-handling.md`
  * `.trellis/spec/backend/logging-guidelines.md`
  * `.trellis/spec/backend/quality-guidelines.md`
  * `.trellis/spec/guides/cross-layer-thinking-guide.md`
* Existing code patterns:
  * `apps/api/src/routes/bootstrap.ts` for thin schema-validated route composition
  * `apps/api/src/lib/validation.ts` for boundary validation guards
  * `apps/api/src/lib/response.ts` for envelope helpers
