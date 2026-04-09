# Continue Web Development

## Goal

Turn the current static `apps/web` scaffold into a product-oriented local MVP that lets developers exercise the first WorldWeaver flows against the placeholder API: world draft generation, draft refinement, world commit, session creation, and chat send.

## What I Already Know

* The current web app is a static landing shell in `apps/web/src/app/page.tsx`.
* The API already exposes `/api/health`, `/api/bootstrap`, `/api/worlds/drafts/generate`, `/api/worlds/drafts/refine`, `/api/worlds/commit`, `/api/sessions`, and `/api/chat/send`.
* Shared catalogs and metadata already live in `@worldweaver/config`.
* Shared request, response, and envelope schemas already live in `@worldweaver/contracts`.
* Local development uses `.env.local`, and `NEXT_PUBLIC_API_BASE_URL` is expected to be configured there.

## Assumptions (Temporary)

* The best next milestone is a single-page interactive control center rather than splitting the product into multiple routes immediately.
* Client components are acceptable for mutation-driven UI because the current milestone requires local form state and async feedback.
* The first frontend MVP should prioritize local developer usability over production auth, persistence, or polished content management.

## Open Questions

* No blocking questions after repo inspection. Proceed with the single-page local MVP assumption unless implementation reveals a hidden contract gap.

## Requirements

* Replace the scaffold-only landing presentation with a product-focused WorldWeaver control center.
* Keep cross-layer metadata sourced from `@worldweaver/config` instead of duplicating values in UI files.
* Validate API responses with shared schemas from `@worldweaver/contracts`.
* Read `NEXT_PUBLIC_API_BASE_URL` as the local API target and surface connection status in the UI.
* Support these flows from the page:
  * draft generation
  * draft refinement
  * world commit
  * session creation
  * chat send
* Show explicit loading, success, and error feedback for async actions.
* Preserve responsive behavior for mobile and desktop without introducing horizontal scroll.

## Acceptance Criteria

* [ ] The homepage renders as a product-oriented WorldWeaver interface instead of a scaffold summary page.
* [ ] A user can generate a world draft from the web UI and see typed response data rendered on the page.
* [ ] A user can refine the current draft and see the updated draft output.
* [ ] A user can commit a draft into a world and see returned processing details.
* [ ] A user can create a session for the committed world from the same page.
* [ ] A user can send a chat message for the active session and see the assistant reply.
* [ ] Async actions show loading and success or error states.
* [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.

## Definition Of Done

* Frontend code follows the current App Router and type-safety guidelines.
* Shared contracts remain the source of truth for cross-layer payloads.
* Local manual usage is possible with `.env.local` and the placeholder API.
* Verification commands pass before handoff.

## Technical Approach

Build a single App Router page that imports shared product catalogs for narrative structure and mounts a client-side control center for the mutation flows. Use a lightweight local API helper to call the existing Fastify placeholder routes, parse envelopes with shared schemas, and keep results in client state. Refresh the visual system to match a clearer AI-native RPG control center using intentional typography, layered gradients, and responsive glass-like panels.

## Decision (ADR-lite)

**Context**: The request to "continue web development" could mean either a better marketing shell or the first real in-browser workflow.

**Decision**: Implement a single-page interactive local MVP that exercises the current placeholder API instead of only polishing the landing shell or immediately splitting into many routes.

**Consequences**: This gives the repo a useful frontend for local integration right now, at the cost of postponing route decomposition and production navigation until later iterations.

## Out Of Scope

* Real authentication and permission boundaries
* Persistent browser-side storage
* Multi-route information architecture
* Production-grade streaming chat
* Real backend persistence, search, memory CRUD, or provider management

## Technical Notes

* Relevant frontend specs:
  * `.trellis/spec/frontend/directory-structure.md`
  * `.trellis/spec/frontend/type-safety.md`
  * `.trellis/spec/frontend/quality-guidelines.md`
* Relevant backend/cross-layer specs:
  * `.trellis/spec/backend/http-contracts.md`
* Existing code patterns:
  * `apps/web/src/app/page.tsx` for shared config imports
  * `apps/web/src/app/layout.tsx` for metadata and root layout
  * `packages/contracts/src/common/api-envelope.ts` for success envelope parsing
* UI/UX direction from `ui-ux-pro-max`:
  * storytelling chapter layout with progressive reveal
  * AI-native low-chrome interaction design
  * bold gaming typography pair: `Russo One` + `Chakra Petch`
  * high-feedback form states and accessible labels
