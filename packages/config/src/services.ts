import { type AppLocale, defaultLocale } from "./i18n.js"

type RoadmapStage = "foundation" | "mvp" | "next"

type BootstrapSummaryView = {
  project_name: string
  product_intent: string
  services: readonly {
    id: "web" | "api" | "worker"
    title: string
    summary: string
    responsibilities: readonly string[]
  }[]
  capabilities: readonly {
    id: string
    title: string
    summary: string
    stage: RoadmapStage
  }[]
  infrastructure: readonly {
    name: string
    role: string
    connection_env: readonly string[]
  }[]
}

const bootstrapSummaryByLocale = {
  en: {
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
          "Fastify service that owns validation, request envelopes, provider routing, and local retrieval orchestration.",
        responsibilities: [
          "Validate and route HTTP requests",
          "Coordinate draft, session, chat, and provider settings flows",
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
          "Provider-backed draft generation and refinement across configurable AI services.",
        stage: "mvp",
      },
      {
        id: "provider-settings",
        title: "Player provider settings",
        summary:
          "Allow players to save and switch OpenAI-compatible, Gemini, and Anthropic-style provider services.",
        stage: "mvp",
      },
      {
        id: "world-commit-flow",
        title: "World commit to processing pipeline",
        summary:
          "Persist local embeddings today while keeping room for future worker-side sync.",
        stage: "mvp",
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
  },
  "zh-CN": {
    project_name: "WorldWeaver RPG",
    product_intent:
      "一个以世界优先创作为核心、具备会话隔离与结构化记忆管线的长上下文角色扮演引擎。",
    services: [
      {
        id: "web",
        title: "世界构建与游玩界面",
        summary: "用于世界草稿、会话聊天、记忆审阅与系统设置的 Next.js 应用。",
        responsibilities: [
          "渲染世界构建工作流",
          "承载玩家聊天与会话状态",
          "暴露记忆管理与 provider 配置界面",
        ],
      },
      {
        id: "api",
        title: "JSON API 与编排层",
        summary:
          "由 Fastify 提供的服务，负责校验、请求 envelope、provider 路由与本地检索编排。",
        responsibilities: [
          "校验并路由 HTTP 请求",
          "协调草稿、会话、聊天与 provider 设置流程",
          "维护前端与 worker 共享的合同",
        ],
      },
      {
        id: "worker",
        title: "异步抽取与同步管线",
        summary: "独立 worker 进程，预留给抽取、总结与向量同步任务。",
        responsibilities: [
          "在聊天或世界提交后执行记忆抽取",
          "协调摘要生成任务",
          "执行 embedding 同步与重试流程",
        ],
      },
    ],
    capabilities: [
      {
        id: "world-draft-flow",
        title: "世界草稿生成与细化",
        summary: "通过可配置 AI provider 真正驱动世界草稿生成与细化。",
        stage: "mvp",
      },
      {
        id: "provider-settings",
        title: "玩家 Provider 设置",
        summary:
          "允许玩家保存并切换 OpenAI 兼容、Gemini 与 Anthropic 风格的 provider 服务。",
        stage: "mvp",
      },
      {
        id: "world-commit-flow",
        title: "世界提交进入处理管线",
        summary:
          "当前先把 embedding 本地持久化，并为未来 worker 同步预留边界。",
        stage: "mvp",
      },
      {
        id: "session-chat-flow",
        title: "单会话聊天闭环",
        summary: "锁定第一版带记忆感知的聊天请求与响应形状。",
        stage: "mvp",
      },
      {
        id: "memory-manager",
        title: "结构化记忆管理",
        summary: "为未来的记忆节点 CRUD 界面与 API 端点预留空间。",
        stage: "next",
      },
    ],
    infrastructure: [
      {
        name: "PostgreSQL",
        role: "世界、会话、消息与记忆节点的主数据源。",
        connection_env: ["POSTGRES_URL"],
      },
      {
        name: "Redis",
        role: "用于队列、缓存与短生命周期草稿状态存储。",
        connection_env: ["REDIS_URL"],
      },
      {
        name: "Qdrant",
        role: "承载长期记忆召回的向量检索层。",
        connection_env: ["QDRANT_URL"],
      },
    ],
  },
} as const satisfies Record<AppLocale, BootstrapSummaryView>

export const bootstrapSummary = bootstrapSummaryByLocale[defaultLocale]

export function getBootstrapSummary(locale: AppLocale) {
  return bootstrapSummaryByLocale[locale]
}
