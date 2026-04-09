export const bootstrapSummary = {
  project_name: "WorldWeaver RPG",
  product_intent:
    "A long-context role-playing engine with world-first authoring, session isolation, and structured memory pipelines.",
  services: [
    {
      id: "web",
      title: "World Builder and Play UI",
      summary:
        "Next.js application for world drafting, session chat, memory review, and system settings.",
      responsibilities: [
        "Render world builder workflows",
        "Host player chat and session state",
        "Expose memory management and provider configuration UIs",
      ],
    },
    {
      id: "api",
      title: "JSON API and orchestration layer",
      summary:
        "Fastify service that owns validation, request envelopes, and future provider orchestration.",
      responsibilities: [
        "Validate and route HTTP requests",
        "Coordinate draft, session, and chat flows",
        "Own contracts shared with the frontend and worker",
      ],
    },
    {
      id: "worker",
      title: "Async extraction and sync pipeline",
      summary:
        "Standalone worker process reserved for extraction, summary, and vector sync jobs.",
      responsibilities: [
        "Handle memory extraction after chat or world commit",
        "Coordinate summary generation jobs",
        "Run embedding sync and retry workflows",
      ],
    },
  ],
  capabilities: [
    {
      id: "world-draft-flow",
      title: "World draft generation and refinement",
      summary:
        "Scaffold API contracts for generate and refine flows before real provider integration.",
      stage: "foundation",
    },
    {
      id: "world-commit-flow",
      title: "World commit to processing pipeline",
      summary:
        "Reserve the HTTP and worker boundaries for extraction and embedding sync.",
      stage: "foundation",
    },
    {
      id: "session-chat-flow",
      title: "Single-session chat loop",
      summary:
        "Lock the first chat request and response shape for memory-aware gameplay.",
      stage: "mvp",
    },
    {
      id: "memory-manager",
      title: "Structured memory management",
      summary:
        "Keep room for future CRUD screens and API endpoints tied to memory nodes.",
      stage: "next",
    },
  ],
  infrastructure: [
    {
      name: "PostgreSQL",
      role: "Primary source of truth for worlds, sessions, messages, and memory nodes.",
      connection_env: ["POSTGRES_URL"],
    },
    {
      name: "Redis",
      role: "Queue, cache, and short-lived draft state storage.",
      connection_env: ["REDIS_URL"],
    },
    {
      name: "Qdrant",
      role: "Vector retrieval layer for long-term memory recall.",
      connection_env: ["QDRANT_URL"],
    },
  ],
} as const
