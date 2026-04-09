# Initialize WorldWeaver Project Scaffold

## Goal

Initialize a production-oriented monorepo scaffold for WorldWeaver RPG based on the product document, so future frontend, backend, and worker development can start from a consistent structure instead of an empty repository.

## What I already know

* The repository currently only contains Trellis workflow files and the product document in `WordWeaverRPG开发文档.md`.
* The product requires a separated frontend, backend service layer, async workers, PostgreSQL as source of truth, Qdrant for vector retrieval, and Redis for draft/cache/queue concerns.
* The first delivery should focus on MVP foundations: world draft flow, world commit flow, single-session chat, memory extraction pipeline, and provider-based integrations.
* Local environment has `node v22.21.0`, `pnpm 10.30.3`, and `python 3.12.12` available.
* Docker is not available in the current environment, so initialization should not rely on container tooling for the first runnable state.

## Assumptions (temporary)

* Use a monorepo so web, api, worker, and shared packages can evolve together.
* Prefer a unified TypeScript application stack for the first scaffold, with Python kept available for future specialized AI/worker utilities if needed.
* The first initialization pass should create foundational project structure, shared config, env templates, and placeholder modules rather than full business implementation.

## Open Questions

* Which application stack should be the default foundation for the first scaffold?

## Requirements (evolving)

* Create a monorepo layout aligned with the product architecture.
* Separate web UI, API, worker, and shared contracts/configuration.
* Provide workspace-level tooling for install, lint, typecheck, and dev entrypoints.
* Capture project assumptions and local startup instructions in repository docs.
* Keep the scaffold ready for PostgreSQL, Redis, and Qdrant integration without requiring them to be installed during initialization.

## Acceptance Criteria (evolving)

* [x] Repository has a clear monorepo structure for `web`, `api`, `worker`, and shared packages.
* [x] Workspace configuration and root scripts are present and install successfully.
* [x] Each app/package has a minimal compilable scaffold or placeholder entrypoint.
* [x] Repository includes environment templates and documentation for next-step setup.
* [x] Basic lint and typecheck commands can run successfully for the initialized scaffold.

## Definition of Done (team quality bar)

* Tests or verification commands are run where applicable.
* Lint and typecheck pass for initialized code.
* Project docs are updated to explain the scaffold and next setup steps.
* The created structure matches the product document's service boundaries and leaves room for the memory pipeline.

## Technical Approach

Initialize a `pnpm` workspace monorepo with:

* `apps/web`: Next.js App Router frontend
* `apps/api`: Fastify-based JSON API service
* `apps/worker`: Node worker process for async jobs and pipeline placeholders
* `packages/contracts`: shared Zod schemas and API envelope types
* `packages/config`: shared constants and service metadata

Use TypeScript end-to-end for the first scaffold so contracts, validation, and service boundaries stay consistent across layers.

## Decision (ADR-lite)

**Context**: The repository is empty, but the product document already defines clear boundaries across UI, API, worker, and data services. The local environment supports Node, pnpm, and Python, while Docker is not available.

**Decision**: Use a TypeScript monorepo with Next.js for the web app, Fastify for the API, a standalone Node worker, and shared Zod contracts/config packages.

**Consequences**:

* Pros: one language across services, straightforward shared contracts, fast local startup, easy future extraction into independently deployed services.
* Cons: Python-first AI tooling is deferred; some infra integrations will need additional setup later.

## Out of Scope (explicit)

* Full implementation of world generation, chat, memory extraction, or provider adapters.
* Production deployment, CI/CD, and infra provisioning.
* Docker compose or cloud deployment files in this first pass.

## Technical Notes

* Source product doc: `WordWeaverRPG开发文档.md`
* Current Trellis task existed before this work: `00-bootstrap-guidelines`, which is unrelated to repository scaffolding.
* Initialization should stay friendly to later additions like shared schema packages, outbox processing, and provider adapters.
* Research note: a unified TypeScript monorepo is the lowest-friction fit for the current environment and for the cross-layer contracts described in the product document.
* Verification note: `pnpm check` and `pnpm build` both pass after dependency installation and shared package compilation are configured.
