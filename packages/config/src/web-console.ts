import { type AppLocale, defaultLocale } from "./i18n.js"
import { mockLocalProviderConfigId } from "./providers.js"

type AsyncStatusCopy = {
  idle: string
  loading: string
  success: string
  error: string
}

type LocalizedStatusCopy = {
  draft: string
  processing: string
  active: string
  paused: string
  ended: string
  archived: string
}

type ControlCenterDefaults = {
  providerConfigId: string
  basePrompt: string
  refineFeedback: string
  worldName: string
  worldTheme: string
  sessionTitle: string
  sessionUserId: string
  chatMessage: string
}

export type WorldWeaverWebCopy = {
  localeSwitcher: {
    eyebrow: string
    title: string
    description: string
  }
  hero: {
    eyebrow: string
    title: string
    tags: readonly [string, string, string]
    ctaLabel: string
    supportCopy: string
  }
  bootstrapSync: {
    label: string
    loading: string
    success: string
    error: string
  }
  signalCards: {
    services: {
      label: string
      summary: string
    }
    routes: {
      label: string
      summary: string
    }
    jobs: {
      label: string
      summary: string
    }
  }
  stageLabels: {
    foundation: string
    mvp: string
    next: string
  }
  sections: {
    playableMvp: {
      eyebrow: string
      title: string
      copy: string
    }
    routeInventory: {
      eyebrow: string
      title: string
      copy: string
    }
    infrastructureSignals: {
      eyebrow: string
      title: string
      copy: string
    }
    asyncMemoryLoop: {
      eyebrow: string
      title: string
      copy: string
    }
  }
  controlCenter: {
    statusLabels: AsyncStatusCopy
    serverStatusLabels: LocalizedStatusCopy
    providers: {
      eyebrow: string
      title: string
      copy: string
      labels: {
        settingsOwner: string
        activeProvider: string
        providerLabel: string
        providerFormat: string
        apiBaseUrl: string
        apiKey: string
        textModel: string
        embeddingModel: string
        capabilities: string
        status: string
        setAsDefault: string
      }
      formatOptions: {
        openai: string
        gemini: string
        anthropic: string
      }
      buttons: {
        refresh: string
        save: string
        clear: string
        edit: string
        use: string
        delete: string
      }
      fallback: {
        idle: string
        emptyList: string
        activeProvider: string
        embeddingUnavailable: string
      }
      messages: {
        loading: string
        saved: string
        deleted: string
      }
    }
    health: {
      eyebrow: string
      title: string
      copy: string
      labels: {
        apiBaseUrl: string
        service: string
        startedAt: string
        lastCheck: string
      }
      fallback: {
        idle: string
        service: string
        startedAt: string
        lastCheck: string
      }
      messages: {
        checking: string
        success: string
      }
      refreshButton: string
      helper: string
    }
    draft: {
      eyebrow: string
      title: string
      copy: string
      labels: {
        basePrompt: string
        providerConfigId: string
        enableSearch: string
        refineFeedback: string
        draftId: string
        draftStatus: string
        outline: string
        referenceNotes: string
        draftText: string
      }
      buttons: {
        generate: string
        refine: string
      }
      fallback: {
        idle: string
      }
      messages: {
        generating: string
        success: string
        refineMissingDraft: string
        refining: string
        commitReady: string
        sessionLocked: string
        chatLocked: string
      }
    }
    commit: {
      eyebrow: string
      title: string
      copy: string
      labels: {
        worldName: string
        theme: string
        currentDraft: string
        worldId: string
        pipelineState: string
        queuedJobs: string
      }
      buttons: {
        commit: string
      }
      fallback: {
        idle: string
        currentDraft: string
      }
      messages: {
        missingDraft: string
        committing: string
        success: string
        sessionReady: string
        chatLocked: string
      }
    }
    session: {
      eyebrow: string
      title: string
      copy: string
      labels: {
        userId: string
        sessionTitle: string
        activeWorld: string
        sessionId: string
        sessionStatus: string
      }
      buttons: {
        create: string
      }
      fallback: {
        idle: string
        activeWorld: string
      }
      messages: {
        missingWorld: string
        creating: string
        success: string
        chatReady: string
      }
    }
    chat: {
      eyebrow: string
      title: string
      copy: string
      labels: {
        playerMove: string
        activeSession: string
        queuedJobs: string
        conversationThread: string
      }
      roles: {
        user: string
        assistant: string
      }
      buttons: {
        send: string
      }
      fallback: {
        idle: string
        activeSession: string
        emptyThread: string
      }
      messages: {
        missingSession: string
        sending: string
        success: string
      }
    }
    defaults: ControlCenterDefaults
  }
}

export const webConsoleCopyByLocale = {
  en: {
    localeSwitcher: {
      eyebrow: "Control Language",
      title: "Bilingual Console",
      description:
        "Switch the local control center between English and Simplified Chinese.",
    },
    hero: {
      eyebrow: "Local RPG Control Center",
      title:
        "Author the world, launch the session, and keep long-form memory in view.",
      tags: ["World Builder", "Session Chat", "Memory Pipeline"],
      ctaLabel: "Open the local control center",
      supportCopy:
        "Powered by placeholder API contracts that already mirror the first product loop.",
    },
    bootstrapSync: {
      label: "Catalog Sync",
      loading: "Syncing localized platform data from the local API.",
      success:
        "Live platform data loaded from /api/bootstrap. Request {requestId}.",
      error:
        "Local bootstrap API unavailable, showing shared fallback data. {reason}",
    },
    signalCards: {
      services: {
        label: "Service surfaces",
        summary: "Web, API, and worker stay aligned around shared contracts.",
      },
      routes: {
        label: "Typed API routes",
        summary:
          "Every local workflow in this page maps to a live placeholder route.",
      },
      jobs: {
        label: "Queued memory jobs",
        summary:
          "Async extraction and summarization are already reserved in the flow.",
      },
    },
    stageLabels: {
      foundation: "Foundation Systems",
      mvp: "Playable Loop",
      next: "Expansion Slot",
    },
    sections: {
      playableMvp: {
        eyebrow: "Playable MVP",
        title: "Move from scaffold visibility to real local interaction.",
        copy: "This first pass keeps everything on one route so we can exercise the full world-to-session loop against the placeholder Fastify service.",
      },
      routeInventory: {
        eyebrow: "Route Inventory",
        title: "Current API surface",
        copy: "These contracts remain the typed backbone for local web flows.",
      },
      infrastructureSignals: {
        eyebrow: "Infrastructure Signals",
        title: "Stateful backbone",
        copy: "The control center keeps these service boundaries visible while the backend remains scaffolded.",
      },
      asyncMemoryLoop: {
        eyebrow: "Async Memory Loop",
        title: "Worker jobs already reserved",
        copy: "Each user action in the web MVP hints at the pipeline that will sit behind it later.",
      },
    },
    controlCenter: {
      statusLabels: {
        idle: "Idle",
        loading: "Loading",
        success: "Ready",
        error: "Error",
      },
      serverStatusLabels: {
        draft: "Draft",
        processing: "Processing",
        active: "Active",
        paused: "Paused",
        ended: "Ended",
        archived: "Archived",
      },
      providers: {
        eyebrow: "Settings",
        title: "Provider settings",
        copy: "Save player-scoped AI provider services here, then reuse them across draft generation, chat, and embeddings.",
        labels: {
          settingsOwner: "Settings owner",
          activeProvider: "Active provider",
          providerLabel: "Provider label",
          providerFormat: "Format",
          apiBaseUrl: "API base URL",
          apiKey: "API key",
          textModel: "Text model",
          embeddingModel: "Embedding model",
          capabilities: "Capabilities",
          status: "Status",
          setAsDefault: "Set as player default",
        },
        formatOptions: {
          openai: "OpenAI-compatible",
          gemini: "Gemini",
          anthropic: "Anthropic",
        },
        buttons: {
          refresh: "Refresh providers",
          save: "Save provider",
          clear: "Clear form",
          edit: "Edit",
          use: "Use now",
          delete: "Delete",
        },
        fallback: {
          idle: "Load the current player's provider settings.",
          emptyList:
            "No player-scoped providers yet. Save one below or keep using the built-in mock provider.",
          activeProvider: "No active provider selected",
          embeddingUnavailable: "Embedding disabled",
        },
        messages: {
          loading: "Loading player provider settings...",
          saved: "Provider settings saved. Request {requestId}.",
          deleted: "Provider removed. Request {requestId}.",
        },
      },
      health: {
        eyebrow: "Runtime Link",
        title: "API handshake",
        copy: "The page reads NEXT_PUBLIC_API_BASE_URL and checks the current Fastify target before deeper actions.",
        labels: {
          apiBaseUrl: "API base URL",
          service: "Service",
          startedAt: "Started at",
          lastCheck: "Last check",
        },
        fallback: {
          idle: "Run a health check to verify the local API target.",
          service: "Awaiting check",
          startedAt: "Not available yet",
          lastCheck: "Checking...",
        },
        messages: {
          checking: "Checking {apiBaseUrl}...",
          success: "API ready. Request {requestId}.",
        },
        refreshButton: "Refresh health",
        helper:
          "If this card stays red, start `pnpm dev:api` and confirm the local URL in `.env.local`.",
      },
      draft: {
        eyebrow: "Chapter 1",
        title: "World draft studio",
        copy: "Generate the first setting pass, then request a refinement without leaving the page.",
        labels: {
          basePrompt: "Base prompt",
          providerConfigId: "Provider config id",
          enableSearch: "Enable search notes for the scaffold response",
          refineFeedback: "Refinement feedback",
          draftId: "Draft id",
          draftStatus: "Draft status",
          outline: "Outline",
          referenceNotes: "Reference notes",
          draftText: "Draft text",
        },
        buttons: {
          generate: "Generate draft",
          refine: "Refine current draft",
        },
        fallback: {
          idle: "Generate a draft to unlock refinement and commit.",
        },
        messages: {
          generating: "Generating the first local world draft...",
          success: "Draft ready. Request {requestId}.",
          refineMissingDraft:
            "Generate a draft before asking for a refinement pass.",
          refining: "Refining {draftId}...",
          commitReady: "Draft is ready. Commit can run next.",
          sessionLocked: "Create a session after the world commit is queued.",
          chatLocked: "Send a message after a session becomes active.",
        },
      },
      commit: {
        eyebrow: "Chapter 2",
        title: "Commit the world",
        copy: "Move from draft mode into the processing pipeline and keep the returned job ids visible.",
        labels: {
          worldName: "World name",
          theme: "Theme",
          currentDraft: "Current draft",
          worldId: "World id",
          pipelineState: "Pipeline state",
          queuedJobs: "Queued jobs",
        },
        buttons: {
          commit: "Commit world",
        },
        fallback: {
          idle: "Commit remains locked until a draft exists.",
          currentDraft: "Generate draft first",
        },
        messages: {
          missingDraft: "Commit needs the current draft id first.",
          committing: "Committing {draftId} into the processing pipeline...",
          success: "World queued. Request {requestId}.",
          sessionReady: "World processing is queued. Launch the first session.",
          chatLocked: "Send a message after a session becomes active.",
        },
      },
      session: {
        eyebrow: "Chapter 3",
        title: "Launch a session",
        copy: "Spin up a player session against the committed world so the chat loop can attach to a concrete session id.",
        labels: {
          userId: "User id",
          sessionTitle: "Session title",
          activeWorld: "Active world",
          sessionId: "Session id",
          sessionStatus: "Session status",
        },
        buttons: {
          create: "Create session",
        },
        fallback: {
          idle: "Create a session after the world commit is queued.",
          activeWorld: "Commit world first",
        },
        messages: {
          missingWorld:
            "Commit the world first so the session knows which world to use.",
          creating: "Creating a session under {worldId}...",
          success: "Session active. Request {requestId}.",
          chatReady:
            "Session is live. Send the opening move to test the placeholder reply.",
        },
      },
      chat: {
        eyebrow: "Chapter 4",
        title: "Story terminal",
        copy: "Send a player move into the placeholder chat route and render the assistant reply with pretext-based line layout.",
        labels: {
          playerMove: "Player move",
          activeSession: "Active session",
          queuedJobs: "Queued jobs",
          conversationThread: "Conversation thread",
        },
        roles: {
          user: "Player",
          assistant: "Assistant",
        },
        buttons: {
          send: "Send opening turn",
        },
        fallback: {
          idle: "Send a message after a session becomes active.",
          activeSession: "Create session first",
          emptyThread:
            "No turns yet. Launch the first message after the session is active.",
        },
        messages: {
          missingSession: "Create a session before sending chat.",
          sending: "Sending the current turn to {sessionId}...",
          success: "Reply received. Request {requestId}.",
        },
      },
      defaults: {
        providerConfigId: mockLocalProviderConfigId,
        basePrompt:
          "Build a rain-soaked gothic megacity where vampire houses control trade routes, debt, and ancient weather engines.",
        refineFeedback:
          "Push the ruling vampire house toward more cyber-gothic aesthetics and add one fragile alliance with machine monks.",
        worldName: "Ash Meridian",
        worldTheme: "Cyber-gothic intrigue with industrial occult politics",
        sessionTitle: "Archive Break-In",
        sessionUserId: "player_local",
        chatMessage:
          "I want to sneak into the Ash Meridian archive without waking the wardens. What do I notice first?",
      },
    },
  },
  "zh-CN": {
    localeSwitcher: {
      eyebrow: "控制语言",
      title: "双语控制台",
      description: "在 English 与 简体中文 之间切换本地控制台文案。",
    },
    hero: {
      eyebrow: "本地 RPG 控制台",
      title: "编织世界、启动会话，并让长程记忆始终保持可见。",
      tags: ["世界构建", "会话聊天", "记忆管线"],
      ctaLabel: "打开本地控制台",
      supportCopy: "由占位 API 合同驱动，已经映射首条产品闭环。",
    },
    bootstrapSync: {
      label: "目录同步",
      loading: "正在从本地 API 同步当前语言的平台数据。",
      success: "已从 /api/bootstrap 加载实时平台数据。请求 {requestId}。",
      error: "本地 bootstrap API 暂不可用，当前显示共享回退数据。{reason}",
    },
    signalCards: {
      services: {
        label: "服务界面",
        summary: "Web、API 与 worker 通过共享合同保持对齐。",
      },
      routes: {
        label: "类型化 API 路由",
        summary: "这个页面里的每条本地流程都映射到一个真实占位路由。",
      },
      jobs: {
        label: "已排队记忆任务",
        summary: "异步抽取与总结流程已经在当前闭环中预留。",
      },
    },
    stageLabels: {
      foundation: "基础系统",
      mvp: "可玩闭环",
      next: "扩展预留",
    },
    sections: {
      playableMvp: {
        eyebrow: "可玩 MVP",
        title: "把脚手架可见性推进为真实的本地交互。",
        copy: "这一版仍然保持单路由，让我们可以直接对着占位 Fastify 服务跑完整的世界到会话闭环。",
      },
      routeInventory: {
        eyebrow: "路由清单",
        title: "当前 API 面",
        copy: "这些合同仍然是本地 Web 流程的类型化骨架。",
      },
      infrastructureSignals: {
        eyebrow: "基础设施信号",
        title: "有状态骨架",
        copy: "即便后端还在脚手架阶段，控制台也会把这些服务边界持续暴露出来。",
      },
      asyncMemoryLoop: {
        eyebrow: "异步记忆闭环",
        title: "已预留的 Worker 任务",
        copy: "Web MVP 中的每一次用户动作，都在提示未来将接上的记忆管线。",
      },
    },
    controlCenter: {
      statusLabels: {
        idle: "待机",
        loading: "进行中",
        success: "就绪",
        error: "错误",
      },
      serverStatusLabels: {
        draft: "草稿",
        processing: "处理中",
        active: "激活",
        paused: "暂停",
        ended: "结束",
        archived: "归档",
      },
      providers: {
        eyebrow: "设置",
        title: "Provider 设置",
        copy: "把玩家作用域的 AI provider 服务保存在这里，然后在草稿生成、聊天和 embedding 流程中复用。",
        labels: {
          settingsOwner: "设置所属玩家",
          activeProvider: "当前 Provider",
          providerLabel: "Provider 名称",
          providerFormat: "格式",
          apiBaseUrl: "API 基址",
          apiKey: "API Key",
          textModel: "文本模型",
          embeddingModel: "向量模型",
          capabilities: "能力",
          status: "状态",
          setAsDefault: "设为玩家默认 Provider",
        },
        formatOptions: {
          openai: "OpenAI 兼容",
          gemini: "Gemini",
          anthropic: "Anthropic",
        },
        buttons: {
          refresh: "刷新 Provider",
          save: "保存 Provider",
          clear: "清空表单",
          edit: "编辑",
          use: "立即使用",
          delete: "删除",
        },
        fallback: {
          idle: "加载当前玩家的 provider 设置。",
          emptyList:
            "当前还没有玩家作用域的 provider。可以先在下方保存一个，或继续使用内置 mock provider。",
          activeProvider: "当前没有激活的 provider",
          embeddingUnavailable: "未启用向量模型",
        },
        messages: {
          loading: "正在加载玩家的 provider 设置...",
          saved: "Provider 设置已保存。请求 {requestId}。",
          deleted: "Provider 已删除。请求 {requestId}。",
        },
      },
      health: {
        eyebrow: "运行链路",
        title: "API 握手",
        copy: "页面会读取 NEXT_PUBLIC_API_BASE_URL，并在执行更深层动作前检查当前 Fastify 目标。",
        labels: {
          apiBaseUrl: "API 基址",
          service: "服务名",
          startedAt: "启动时间",
          lastCheck: "最近检查",
        },
        fallback: {
          idle: "运行一次健康检查，确认本地 API 目标可用。",
          service: "等待检查",
          startedAt: "暂时不可用",
          lastCheck: "检查中...",
        },
        messages: {
          checking: "正在检查 {apiBaseUrl}...",
          success: "API 已就绪。请求 {requestId}。",
        },
        refreshButton: "刷新健康状态",
        helper:
          "如果这张卡片一直是红色，请先启动 `pnpm dev:api`，再确认 `.env.local` 里的本地 URL。",
      },
      draft: {
        eyebrow: "章节 1",
        title: "世界草稿工作台",
        copy: "先生成首版设定，再在不离开页面的情况下继续细化。",
        labels: {
          basePrompt: "基础提示词",
          providerConfigId: "Provider 配置 ID",
          enableSearch: "为脚手架响应启用搜索备注",
          refineFeedback: "细化反馈",
          draftId: "草稿 ID",
          draftStatus: "草稿状态",
          outline: "提纲",
          referenceNotes: "参考备注",
          draftText: "草稿正文",
        },
        buttons: {
          generate: "生成草稿",
          refine: "细化当前草稿",
        },
        fallback: {
          idle: "先生成草稿，才能继续细化与提交。",
        },
        messages: {
          generating: "正在生成第一版本地世界草稿...",
          success: "草稿已就绪。请求 {requestId}。",
          refineMissingDraft: "请先生成草稿，再发起细化。",
          refining: "正在细化 {draftId}...",
          commitReady: "草稿已准备好，可以继续提交。",
          sessionLocked: "世界提交进入队列后，再创建会话。",
          chatLocked: "会话激活后，再发送消息。",
        },
      },
      commit: {
        eyebrow: "章节 2",
        title: "提交世界",
        copy: "把草稿模式推进到处理管线，并持续显示返回的任务 ID。",
        labels: {
          worldName: "世界名称",
          theme: "主题",
          currentDraft: "当前草稿",
          worldId: "世界 ID",
          pipelineState: "管线状态",
          queuedJobs: "已排队任务",
        },
        buttons: {
          commit: "提交世界",
        },
        fallback: {
          idle: "在草稿存在之前，提交操作保持锁定。",
          currentDraft: "请先生成草稿",
        },
        messages: {
          missingDraft: "提交前需要先拿到当前草稿 ID。",
          committing: "正在把 {draftId} 提交进处理管线...",
          success: "世界已入队。请求 {requestId}。",
          sessionReady: "世界处理已排队，可以启动第一个会话。",
          chatLocked: "会话激活后，再发送消息。",
        },
      },
      session: {
        eyebrow: "章节 3",
        title: "启动会话",
        copy: "在已提交的世界上拉起玩家会话，让聊天闭环绑定到具体 session id。",
        labels: {
          userId: "用户 ID",
          sessionTitle: "会话标题",
          activeWorld: "当前世界",
          sessionId: "会话 ID",
          sessionStatus: "会话状态",
        },
        buttons: {
          create: "创建会话",
        },
        fallback: {
          idle: "世界提交进入队列后，再创建会话。",
          activeWorld: "请先提交世界",
        },
        messages: {
          missingWorld: "请先提交世界，这样会话才能知道要绑定哪个世界。",
          creating: "正在为 {worldId} 创建会话...",
          success: "会话已激活。请求 {requestId}。",
          chatReady: "会话已启动，可以发送开场动作测试占位回复。",
        },
      },
      chat: {
        eyebrow: "章节 4",
        title: "叙事终端",
        copy: "把玩家动作发到占位聊天路由，并用 pretext 排版渲染助手回复。",
        labels: {
          playerMove: "玩家动作",
          activeSession: "当前会话",
          queuedJobs: "已排队任务",
          conversationThread: "对话线程",
        },
        roles: {
          user: "玩家",
          assistant: "助手",
        },
        buttons: {
          send: "发送开场回合",
        },
        fallback: {
          idle: "会话激活后，再发送消息。",
          activeSession: "请先创建会话",
          emptyThread: "还没有对话回合。请在会话激活后发送第一条消息。",
        },
        messages: {
          missingSession: "发送聊天前需要先创建会话。",
          sending: "正在把当前回合发送到 {sessionId}...",
          success: "已收到回复。请求 {requestId}。",
        },
      },
      defaults: {
        providerConfigId: mockLocalProviderConfigId,
        basePrompt:
          "构建一座被暴雨浸透的哥特巨型都市，让吸血鬼家族掌控贸易航线、债务与古老天气引擎。",
        refineFeedback:
          "把统治吸血鬼家族推进得更赛博哥特一些，并补上一支与机械僧侣之间脆弱的联盟。",
        worldName: "灰烬子午线",
        worldTheme: "工业神秘主义下的赛博哥特阴谋",
        sessionTitle: "档案库潜入",
        sessionUserId: "player_local",
        chatMessage:
          "我想潜入灰烬子午线的档案库，又不惊动守卫。我首先会注意到什么？",
      },
    },
  },
} as const satisfies Record<AppLocale, WorldWeaverWebCopy>

export const worldWeaverWebCopy = webConsoleCopyByLocale[defaultLocale]

export function getWorldWeaverWebCopy(locale: AppLocale) {
  return webConsoleCopyByLocale[locale]
}
