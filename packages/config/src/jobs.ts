import { type AppLocale, defaultLocale } from "./i18n.js"

type WorkerJobDescriptor = {
  id: string
  trigger: string
  summary: string
}

type ApiRouteDescriptor = {
  method: "GET" | "POST"
  path: string
  purpose: string
}

const workerJobCatalogByLocale = {
  en: [
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
  ],
  "zh-CN": [
    {
      id: "draft_commit_extraction",
      trigger: "世界提交",
      summary: "从最终世界草稿中抽取结构化记忆节点。",
    },
    {
      id: "embedding_sync",
      trigger: "记忆节点已持久化",
      summary: "生成 embeddings，并把当前记忆版本 upsert 到 Qdrant。",
    },
    {
      id: "session_memory_extraction",
      trigger: "助手回复已存储",
      summary: "从聊天历史中抽取长期事实、实体以及关系变化。",
    },
    {
      id: "session_summary",
      trigger: "对话到达检查点",
      summary: "生成分段摘要，让提示词保持紧凑且连贯。",
    },
  ],
} as const satisfies Record<AppLocale, readonly WorkerJobDescriptor[]>

const apiRouteCatalogByLocale = {
  en: [
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
  ],
  "zh-CN": [
    {
      method: "GET",
      path: "/api/health",
      purpose: "验证 API 就绪状态与环境连接。",
    },
    {
      method: "GET",
      path: "/api/bootstrap",
      purpose: "向前端或工具暴露脚手架平台地图。",
    },
    {
      method: "POST",
      path: "/api/worlds/drafts/generate",
      purpose: "首版世界草稿生成合同。",
    },
    {
      method: "POST",
      path: "/api/worlds/drafts/refine",
      purpose: "迭代式世界草稿细化合同。",
    },
    {
      method: "POST",
      path: "/api/worlds/commit",
      purpose: "把草稿提交进异步处理管线。",
    },
    {
      method: "POST",
      path: "/api/sessions",
      purpose: "在已有世界下创建一个新会话。",
    },
    {
      method: "POST",
      path: "/api/chat/send",
      purpose: "发送一轮聊天并排队记忆更新。",
    },
  ],
} as const satisfies Record<AppLocale, readonly ApiRouteDescriptor[]>

export const workerJobCatalog = workerJobCatalogByLocale[defaultLocale]

export const apiRouteCatalog = apiRouteCatalogByLocale[defaultLocale]

export function getWorkerJobCatalog(locale: AppLocale) {
  return workerJobCatalogByLocale[locale]
}

export function getApiRouteCatalog(locale: AppLocale) {
  return apiRouteCatalogByLocale[locale]
}
