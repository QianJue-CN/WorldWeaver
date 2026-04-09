# Integrate AI Providers and Embeddings

## Goal

Replace the remaining scaffold-only AI behavior with a real provider integration layer that supports text generation and embedding generation, then wire that layer into the current world draft, refinement, commit, and session chat flows.

## What I Already Know

* The current API still accepts `provider_config_id`, but no real provider registry or runtime client exists yet.
* `cfg_openai_default` is already the canonical placeholder id across the web console defaults and API request examples.
* The product document explicitly calls for pluggable LLM providers, embedding providers, and vector-service-backed memory retrieval.
* The API now has a local persistence layer in `apps/api/src/repositories/local-state.ts` and a business service layer in `apps/api/src/services/mvp-service.ts`.
* Worker job ids already reserve `embedding_sync`, `session_memory_extraction`, and `session_summary`, but the worker does not yet execute those pipelines.
* Local runtime env loading is already standardized through `packages/config/src/runtime-env.ts`.

## Assumptions (Temporary)

* The first real provider integration should be OpenAI-based because the repo already uses `cfg_openai_default`.
* We should implement the provider layer so additional providers can be added later without rewriting routes or business services.
* It is acceptable to keep vector retrieval local for now by generating embeddings and using them inside the API service, even before a real Qdrant sync worker exists.
* A local mock provider should remain available for testing and offline development.

## Open Questions

* No blocking questions after repo and document inspection. Proceed with an extensible provider abstraction plus OpenAI and mock implementations.

## Requirements

* Add a provider registry that resolves `provider_config_id` into language-model and embedding-model runtime capabilities.
* Add env-backed OpenAI runtime configuration for text generation and embeddings.
* Add a local mock provider for deterministic tests and offline development.
* Implement real text-generation calls for world draft generation, draft refinement, and session chat replies.
* Implement real embedding generation and persist local embedding records tied to worlds and chat turns.
* Use stored embeddings to perform local similarity retrieval and inject the best matching world context into chat generation.
* Validate unknown or unavailable provider configs with explicit API errors instead of silent scaffold fallbacks.
* Keep API request and response contracts aligned across web, api, and config packages.
* Expose provider discovery metadata where helpful for future UI and tooling.
* Add automated tests for provider registry behavior, provider-backed service flows, and embedding-driven retrieval behavior.
* Update Trellis specs and docs to capture the new provider and embedding patterns.

## Acceptance Criteria

* [ ] `provider_config_id` is validated against a real provider registry.
* [ ] OpenAI runtime config is loaded from env and used for text and embedding requests.
* [ ] A mock provider config remains available for tests and local fallback workflows.
* [ ] Draft generation and refinement call the provider layer instead of returning hardcoded scaffold prose.
* [ ] Chat replies call the provider layer and include retrieved world context when relevant embeddings exist.
* [ ] World commit persists at least one embedding record for the committed world source text.
* [ ] Chat flow persists embedding records for the session turn or retrieved prompt input needed for later memory work.
* [ ] Unknown provider ids or missing provider credentials return explicit error envelopes.
* [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm --filter @worldweaver/api test` pass.

## Definition Of Done

* Provider integration is real enough to support actual text and embedding model calls.
* API routes remain thin and continue delegating behavior to services.
* New provider and embedding contracts are documented in code-specs.
* Verification commands pass before handoff.

## Technical Approach

Create an API-local AI integration layer composed of a provider registry, provider clients, prompt builders, and embedding helpers. OpenAI will be the first real provider using official text-generation and embedding APIs, while a deterministic mock provider will remain available for tests and offline development. `MvpService` will delegate all AI work to this layer, persist embedding artifacts in local state, and use cosine similarity retrieval to inject the best matching world context into chat generation.

## Decision (ADR-lite)

**Context**: The current backend is stateful, but all AI behavior is still scaffold prose. The product direction requires pluggable text and embedding providers.

**Decision**: Implement an extensible provider abstraction with OpenAI as the first real provider and a mock provider as the deterministic local/testing fallback.

**Consequences**: This unlocks real AI behavior without hardcoding provider details into route handlers or business services, but it also introduces env-driven configuration, external API failure modes, and more explicit provider error handling.

## Out Of Scope

* Anthropic, Gemini, or search-provider implementations in this pass
* Real Qdrant upsert and retry orchestration
* Full provider settings UI
* Structured memory extraction and summary-worker execution

## Technical Notes

* Relevant product sections:
  * provider configuration requirements
  * model adapter
  * embedding sync worker
  * prompt assembly and memory retrieval
* Relevant local code:
  * `apps/api/src/services/mvp-service.ts`
  * `apps/api/src/repositories/local-state.ts`
  * `packages/contracts/src/mvp.ts`
  * `packages/contracts/src/bootstrap.ts`
  * `packages/config/src/web-console.ts`
  * `packages/config/src/services.ts`
* Relevant specs:
  * `.trellis/spec/backend/http-contracts.md`
  * `.trellis/spec/backend/directory-structure.md`
  * `.trellis/spec/backend/error-handling.md`
  * `.trellis/spec/backend/logging-guidelines.md`
  * `.trellis/spec/backend/quality-guidelines.md`
  * `.trellis/spec/guides/cross-layer-thinking-guide.md`
* External reference direction:
  * official OpenAI Responses API docs
  * official OpenAI embeddings docs
