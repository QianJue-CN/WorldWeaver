# Logging Guidelines

> How logging is currently done in the backend scaffold.

---

## Overview

Logging is split by runtime:

- `apps/api` uses Fastify's built-in logger
- `apps/worker` currently uses `console.info` in the bootstrap file only

This is a scaffold-stage convention, not a final observability design. New backend feature code should avoid adding more ad-hoc console logging and should move toward a shared structured logger when worker handlers become real.

---

## Log Levels

### API

The API logger is configured in `apps/api/src/server.ts`:

- `info` in development
- `warn` outside development

Use:

- `app.log.info(...)` for startup and expected lifecycle events
- `app.log.error(error)` for fatal startup failures

### Worker

The worker currently prints bootstrap information with `console.info(...)` in `apps/worker/src/index.ts`.

Allowed today:

- boot confirmation
- dependency target summary
- registered job summary
- heartbeat output

Do not spread this pattern into future job handlers. Replace it with a structured logger when worker behavior grows beyond scaffold bootstrap.

---

## Structured Logging

### Current Minimum Contract

- API responses carry `request_id`
- Any route-aware logs should be correlatable with Fastify `request.id`
- Shared infrastructure identifiers come from parsed env, not hand-written strings

### Required Fields for Future Logs

When adding richer logs, include these when available:

- `request_id`
- `world_id`
- `session_id`
- `provider`
- `worker_job_id`

These fields are already named in the product document and should stay stable.

---

## What to Log

- successful API startup host and port
- fatal startup errors
- worker boot state and registered job count
- infrastructure target names, but not secrets
- lifecycle milestones such as queue registration or handler activation

---

## What NOT to Log

- raw API keys
- full provider config secrets
- raw prompt bodies or user content unless a future debugging spec explicitly allows it
- repeated duplicate logs for every small helper call
- direct `process.env` dumps

---

## Common Mistakes

### Common Mistake: Logging Secrets by Accident

Bad:

```ts
console.info(process.env)
```

Use parsed env selectively instead, and never print secret values.

### Common Mistake: Mixing Fastify Logger and Arbitrary Console Calls in API Code

Bad:

```ts
console.info("API started")
```

Correct:

```ts
app.log.info(`WorldWeaver API listening on http://${env.API_HOST}:${env.API_PORT}`)
```

### Common Mistake: Copying the Worker Bootstrap Pattern into Real Handlers

The `console.info` calls in `apps/worker/src/index.ts` are a temporary scaffold boundary. They are not permission to use console logging throughout backend feature code.
