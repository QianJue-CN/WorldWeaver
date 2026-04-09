# Backend Development Guidelines

> Best practices for backend development in this project.

---

## Overview

These documents describe the current backend conventions for the WorldWeaver scaffold.

The repository is a `pnpm` monorepo with three backend-facing areas:

- `apps/api` for the Fastify HTTP service
- `apps/worker` for async job processing bootstrap code
- `packages/contracts` and `packages/config` for cross-layer contracts and shared defaults

For backend work that changes any request shape, env key, or worker-visible contract, read `http-contracts.md` first.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Updated |
| [HTTP Contracts](./http-contracts.md) | Executable API, env, and cross-layer scaffold contracts | Updated |
| [Database Guidelines](./database-guidelines.md) | ORM patterns, queries, migrations | Pending persistence layer |
| [Error Handling](./error-handling.md) | Error types, handling strategies | Updated |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | Updated |
| [Logging Guidelines](./logging-guidelines.md) | Structured logging, log levels | Updated |

---

## Reading Order

1. `http-contracts.md` for API or worker boundary changes
2. `directory-structure.md` before creating new backend files
3. `error-handling.md` and `logging-guidelines.md` before adding new runtime behavior
4. `quality-guidelines.md` before finishing a backend task

---

**Language**: All documentation should be written in **English**.
