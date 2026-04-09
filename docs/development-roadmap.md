# Development Roadmap

This document captures the current pending work after the first real AI provider and provider-settings integration pass.

## Current State

The project now supports:

- player-scoped provider settings in the web console
- OpenAI-compatible text generation and embeddings
- Gemini text generation and embeddings
- Anthropic text generation
- local embedding persistence and prompt-time similarity retrieval
- mock-provider fallback for offline development and tests

## Pending Work

### Security and Settings Hardening

- Encrypt or otherwise securely store user-supplied API keys instead of keeping raw values in local API state.
- Add provider connectivity tests in the settings UI so players can verify credentials before using them in draft or chat flows.
- Improve field-level validation and format guidance for custom provider base URLs and model names.
- Add richer provider status states, including rate-limit and upstream-auth failure feedback.

### AI and Retrieval Depth

- Add search-provider configuration and actual search-agent integration for draft generation.
- Move prompt construction toward a fuller memory-engine model with explicit working memory, episodic memory, and retrieved long-term memory layers.
- Expand retrieval beyond local best-effort similarity matching and prepare the handoff to real Qdrant-backed recall.
- Add structured extraction and summary generation flows after assistant turns.

### Persistence and Worker Ownership

- Replace the local JSON-backed repository with PostgreSQL-backed persistence.
- Move embedding generation, retry handling, and outbox-style sync orchestration into the worker instead of API-side best effort.
- Persist memory nodes, embedding outbox jobs, and audit-friendly provider usage metadata in a more production-ready model.

### Frontend Productization

- Break the current single-page control center into clearer product surfaces for settings, world builder, session play, and memory management.
- Add explicit active-provider selection UX instead of relying on free-text provider ids in the main authoring flow.
- Add player-facing feedback for embedding availability, retrieval hits, and provider capability differences such as Anthropic's current text-only path.
- Add browser-level tests for provider settings and core world/session flows.

## Recommended Next Plan

### Phase 1: Secure Provider Settings

Goal:
Harden the current provider-settings implementation so it is safe and comfortable for regular use.

Suggested scope:

- secure secret storage
- provider test connection endpoint
- clearer validation and error copy
- better default-provider behavior in the UI

### Phase 2: Worker-Owned Embedding Pipeline

Goal:
Move embedding creation and retry logic out of request-time API handling and into the worker pipeline.

Suggested scope:

- embedding outbox records
- worker-side embedding generation
- retry and dead-letter behavior
- status visibility in the UI

### Phase 3: Search and Memory Expansion

Goal:
Make world drafting and session play feel closer to the product document's intended long-context architecture.

Suggested scope:

- search provider settings and runtime integration
- summary generation
- memory extraction
- richer retrieval and prompt layering

### Phase 4: Product Surface Split

Goal:
Turn the current local control center into clearer user-facing workflows.

Suggested scope:

- dedicated settings surface
- dedicated world builder surface
- dedicated play/session surface
- dedicated memory manager surface
