# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

Backend changes in this project must keep API, worker, and shared package contracts synchronized.

The minimum verification gate for scaffold-stage backend work is:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Forbidden Patterns

### Do Not Read `process.env` Directly Outside `env.ts`

Why:

- config validation becomes inconsistent
- startup failures move from boot time to runtime

Use the parsed `env` object from the runtime-specific `env.ts` module instead.

### Do Not Redefine HTTP Schemas Inside Routes

Why:

- web and API contracts drift
- shared package consumers lose the source of truth

Request and response schemas belong in `packages/contracts/src`.

### Do Not Import Sibling Package Source with Relative Paths

Bad:

```ts
import { draftGenerateRequestSchema } from "../../../packages/contracts/src/mvp"
```

Correct:

```ts
import { draftGenerateRequestSchema } from "@worldweaver/contracts"
```

### Do Not Return Raw JSON from Routes

Always return through `success()` or the validation helper path.

---

## Required Patterns

### Pattern: Shared Package Boundary

- `@worldweaver/contracts` for request and response schemas
- `@worldweaver/config` for shared defaults and catalogs

### Pattern: Build Shared Packages Before App Runtime Work

The workspace scripts already enforce this for app type checking and dev entrypoints.

If you add a new app-level script that depends on shared packages, make sure it either:

- runs after `pnpm build:shared`, or
- uses a workflow that guarantees shared package output exists

### Pattern: Response Validation Before Sending

Routes should parse placeholder or real response payloads against the matching shared response schema before returning them.

---

## Testing Requirements

### Current Baseline

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

### When New Backend Behavior Is Added

Add automated tests when any of the following appears:

- real persistence
- external provider calls
- background job handlers
- non-trivial branching or retry behavior

At that point, test at least:

- valid request path
- invalid request path
- envelope shape
- startup config parsing
- cross-layer identifier consistency such as `queued_jobs`

---

## Code Review Checklist

- Does the change update `packages/contracts` first when payloads changed?
- Does it update `packages/config` when shared defaults or job ids changed?
- Are route responses wrapped in the standard envelope?
- Are env keys parsed once in `env.ts`?
- Did the author run `pnpm lint`, `pnpm typecheck`, and `pnpm build`?
- If a contract changed, was `http-contracts.md` updated too?
