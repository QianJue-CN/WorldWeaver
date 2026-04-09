# Type Safety

> Type safety patterns in this project.

---

## Overview

The frontend uses strict TypeScript from the workspace root and consumes cross-layer data through shared packages.

Current sources of truth:

- `@worldweaver/contracts` for request and response schemas
- `@worldweaver/config` for shared catalogs, metadata, and local defaults

The frontend does not own API payload definitions locally.

---

## Type Organization

### Shared Types

Cross-layer contract types belong in `packages/contracts/src`.

Examples:

- `DraftGenerateRequest`
- `CommitWorldResponse`
- `ApiEnvelope<T>`

### Shared Readonly Metadata

Platform metadata intended for display belongs in `packages/config/src` and should usually be exported with `as const`.

Examples:

- `bootstrapSummary`
- `apiRouteCatalog`
- `workerJobCatalog`
- `localServiceDefaults`

### Frontend-Local Types

Frontend-local types are acceptable when they describe rendering concerns that do not cross the API boundary.

Do not create frontend-local types for server payloads that already exist in `@worldweaver/contracts`.

---

## Validation

### Current Boundary Rule

The backend owns runtime request validation today through Zod and `parseBody()`.

When frontend API calls are introduced, prefer one of these:

1. parse server responses with shared schemas from `@worldweaver/contracts`
2. build a typed API client whose request and response generics come from those shared schemas

### Current Example

The frontend now consumes typed readonly fallback metadata from `@worldweaver/config` and typed runtime API metadata through `apps/web/src/lib/api.ts`.

Current example:

- `apps/web/src/components/worldweaver-home.tsx` builds a fallback catalog from `getBootstrapSummary(locale)`, `getApiRouteCatalog(locale)`, and `getWorkerJobCatalog(locale)`
- `apps/web/src/lib/api.ts` fetches `/api/bootstrap?locale=...`
- the response is parsed with `bootstrapCatalogResponseSchema`

That is the preferred pattern for any cross-layer display data that has both a local fallback and a runtime API source.

---

## Common Patterns

### Pattern: Use `as const` for Display Catalogs

This preserves literal values for stage labels, route catalogs, and job identifiers.

### Pattern: Use Framework Types at Boundaries

Examples already in the codebase:

- `Metadata` in `layout.tsx`
- `Readonly<{ children: ReactNode }>` for layout props

### Pattern: Keep Shared Imports Package-Based

Good:

```ts
import { bootstrapSummary } from "@worldweaver/config"
```

Bad:

```ts
import { bootstrapSummary } from "../../../packages/config/src/services"
```

---

## Forbidden Patterns

- `any`
- `as unknown as`
- duplicated request or response types in UI code
- relative imports into sibling workspace package source
- hand-written string unions that already exist in shared contracts or config

---

## Good / Base / Bad Cases

### Good

- import shared metadata from `@worldweaver/config`
- parse `/api/bootstrap` through `bootstrapCatalogResponseSchema` before rendering
- reuse shared contract types when building future API clients

### Base

- route-local view helpers are acceptable if they are purely presentational
- localized fallback builders are acceptable when they only compose shared config and shared contracts

### Bad

- redefine `queued_jobs` or endpoint paths in UI code
- create local copies of API response shapes because the page only needs one field today
- fetch locale-aware platform data without passing through shared contract parsing
