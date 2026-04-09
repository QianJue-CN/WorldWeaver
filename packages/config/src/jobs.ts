export const workerJobCatalog = [
  {
    id: "draft_commit_extraction",
    trigger: "World commit",
    summary: "Extract structured memory nodes from the final world draft.",
  },
  {
    id: "embedding_sync",
    trigger: "Memory node persisted",
    summary:
      "Generate embeddings and upsert the current memory version into Qdrant.",
  },
  {
    id: "session_memory_extraction",
    trigger: "Assistant reply stored",
    summary:
      "Extract long-lived facts, entities, and relation changes from chat history.",
  },
  {
    id: "session_summary",
    trigger: "Conversation reaches a checkpoint",
    summary:
      "Generate episodic summaries to keep the prompt compact and coherent.",
  },
] as const

export const apiRouteCatalog = [
  {
    method: "GET",
    path: "/api/health",
    purpose: "Verify API readiness and environment wiring.",
  },
  {
    method: "GET",
    path: "/api/bootstrap",
    purpose: "Expose the scaffolded platform map to the frontend or tooling.",
  },
  {
    method: "POST",
    path: "/api/worlds/drafts/generate",
    purpose: "Initial world draft generation contract.",
  },
  {
    method: "POST",
    path: "/api/worlds/drafts/refine",
    purpose: "Iterative world draft refinement contract.",
  },
  {
    method: "POST",
    path: "/api/worlds/commit",
    purpose: "Commit a draft into the async processing pipeline.",
  },
  {
    method: "POST",
    path: "/api/sessions",
    purpose: "Create a new session under an existing world.",
  },
  {
    method: "POST",
    path: "/api/chat/send",
    purpose: "Send one turn of chat and queue memory updates.",
  },
] as const
