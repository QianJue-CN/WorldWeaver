# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

These documents describe the current frontend conventions for the WorldWeaver scaffold.

The frontend currently consists of a single Next.js App Router app under `apps/web`, backed by shared catalogs in `@worldweaver/config`. Shared request and response contracts live in `@worldweaver/contracts` and should be treated as the future API client source of truth.

## Required Skill Usage

For this project, any task focused on frontend UI or UX must use `.agents/skills/ui-ux-pro-max/SKILL.md` before implementation.

This requirement applies to:

- New page or screen design
- UI redesign or visual polish
- Layout and interaction changes
- Component styling work
- UI-focused review or improvement tasks

Use the skill output as a required input for visual direction, design system decisions, typography, color palette, interaction patterns, responsive behavior, and accessibility checks.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Updated |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | Pending first reusable component set |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | Pending first client data flow |
| [State Management](./state-management.md) | Local state, global state, server state | Pending first interactive state layer |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | Updated |
| [Type Safety](./type-safety.md) | Type patterns, validation | Updated |

---

## Reading Order

1. `directory-structure.md` before adding new frontend files
2. `type-safety.md` when consuming shared contracts or catalogs
3. `quality-guidelines.md` before finishing UI work
4. `component-guidelines.md`, `hook-guidelines.md`, and `state-management.md` once those layers exist in code

---

**Language**: All documentation should be written in **English**.
