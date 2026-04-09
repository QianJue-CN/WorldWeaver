# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

The frontend is currently a static Next.js App Router shell backed by shared workspace packages.

The minimum verification gate for frontend changes is:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Forbidden Patterns

### Do Not Start UI Work Without `ui-ux-pro-max`

For any UI or UX-oriented task, use `.agents/skills/ui-ux-pro-max/SKILL.md` before implementation.

This includes:

- new screens
- redesigns
- visual polish
- layout changes
- interaction refinement
- UI-focused review tasks

### Do Not Duplicate Shared Platform Data in Page Files

Bad:

- copy API route definitions into `page.tsx`
- redefine worker job ids in UI code
- hardcode service summaries already owned by `@worldweaver/config`

Use shared packages instead.

### Do Not Add `use client` by Default

The current scaffold works as a server-rendered route. Add client components only when interactivity requires browser APIs, local state, or eventful UI behavior.

### Do Not Scatter Raw Palette Values Across Components

Global visual tokens should be defined once in `globals.css` and reused through CSS variables or a deliberate local token block.

---

## Required Patterns

### Pattern: Shared Source of Truth for Cross-Layer Metadata

`apps/web/src/components/worldweaver-home.tsx` now composes metadata from two approved sources:

- locale-aware fallback data from `@worldweaver/config`
- runtime bootstrap sync through `/api/bootstrap`

The API client in `apps/web/src/lib/api.ts` parses the runtime response with the shared bootstrap schema before rendering.

Follow the same pattern for any metadata also used by API or worker: shared fallback in workspace packages, typed runtime sync through shared contracts.

### Pattern: Responsive Layout Must Be Present from the First Version

The scaffold already includes a mobile breakpoint in `globals.css`.

Any new page should at minimum:

- avoid horizontal scrolling on mobile
- adapt spacing below tablet width
- preserve readable line length

### Pattern: Visual Decisions Must Be Intentional

When editing UI:

- derive a design system first through `ui-ux-pro-max`
- keep typography, palette, and interaction decisions internally consistent
- check desktop and mobile layouts before finishing

---

## Testing Requirements

### Current Baseline

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

### Manual UI Checks Required Today

- verify the page at mobile and desktop widths
- confirm no broken shared package imports
- confirm content still renders without client-side hooks
- confirm locale switch updates both local fallback copy and `/api/bootstrap` synchronized data

### Future Requirement

When client interactions or data fetching are added, introduce UI tests for:

- route rendering
- loading and error states
- interactive behavior
- responsive regressions

---

## Code Review Checklist

- Was `ui-ux-pro-max` used for UI-facing work?
- Did the change keep App Router conventions intact?
- Does the page consume shared package data instead of duplicating it?
- Was `use client` added only when necessary?
- Were `pnpm lint`, `pnpm typecheck`, and `pnpm build` run?
- Was mobile layout checked?
