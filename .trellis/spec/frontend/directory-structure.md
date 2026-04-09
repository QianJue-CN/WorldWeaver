# Directory Structure

> How frontend code is organized in this project.

---

## Overview

The frontend currently lives in `apps/web` and uses the Next.js App Router.

At scaffold stage, the frontend is intentionally shallow:

- route entrypoints live under `src/app`
- shared visual tokens live in `src/app/globals.css`
- cross-layer display data comes from `@worldweaver/config`

Do not create speculative folders for hooks, stores, or generic utilities until the first real feature needs them.

---

## Directory Layout

```text
apps/web/
├── next.config.ts
├── next-env.d.ts
├── tsconfig.json
└── src/
    └── app/
        ├── globals.css
        ├── layout.tsx
        └── page.tsx
```

---

## Module Organization

### Rule: Follow App Router File Conventions

- route entrypoint: `page.tsx`
- route layout: `layout.tsx`
- route-level styles that affect the whole app: `globals.css`

### Rule: Shared Product Metadata Comes from Packages

Data that is also needed by API or worker, such as route catalogs or service descriptions, must be imported from workspace packages rather than duplicated in UI files.

### Rule: Add New Folders Only When a Real Need Appears

When the first reusable view building blocks appear, prefer:

```text
src/
├── app/
├── components/
└── lib/
```

Until then, keep route-local scaffold code colocated in `src/app`.

---

## Naming Conventions

- App Router reserved files use framework naming exactly: `page.tsx`, `layout.tsx`
- Exported React components use PascalCase function names
- CSS class names remain lowercase and descriptive
- Shared package imports use package names such as `@worldweaver/config`, not relative paths into sibling packages

---

## Examples

- `apps/web/src/app/page.tsx` shows a route component consuming shared catalogs
- `apps/web/src/app/layout.tsx` shows the root layout and metadata boundary
- `apps/web/src/app/globals.css` shows page-wide design tokens and responsive layout rules
