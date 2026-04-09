import { type AppLocale, defaultLocale } from "./i18n.js"

type ApiScaffoldCopy = {
  envelopeMessages: {
    ok: string
    scaffolded: string
    queued: string
    created: string
  }
  draftGenerate: {
    draftTextPrefix: string
    outline: readonly string[]
    referenceNotes: {
      searchEnabled: string
      localOnly: string
    }
  }
  draftRefine: {
    draftTextPrefix: string
    outline: readonly string[]
    referenceNotes: readonly string[]
  }
  session: {
    defaultTitle: string
  }
  chat: {
    assistantMessage: string
  }
}

const apiScaffoldCopyByLocale = {
  en: {
    envelopeMessages: {
      ok: "ok",
      scaffolded: "scaffolded",
      queued: "queued",
      created: "created",
    },
    draftGenerate: {
      draftTextPrefix: "Scaffold placeholder for world draft",
      outline: [
        "Core premise",
        "Major factions",
        "Signature locations",
        "Rule constraints",
      ],
      referenceNotes: {
        searchEnabled:
          "Search provider integration is scaffolded but not connected yet.",
        localOnly: "Local-only draft generation scaffold active.",
      },
    },
    draftRefine: {
      draftTextPrefix: "Scaffold refinement",
      outline: ["Updated premise", "Adjusted factions", "Revision notes"],
      referenceNotes: [
        "Refinement pipeline contract is ready for provider wiring.",
      ],
    },
    session: {
      defaultTitle: "New Session",
    },
    chat: {
      assistantMessage:
        "Scaffold reply: the memory engine, retrieval layer, and model adapter will attach here next.",
    },
  },
  "zh-CN": {
    envelopeMessages: {
      ok: "成功",
      scaffolded: "占位响应已生成",
      queued: "已进入队列",
      created: "已创建",
    },
    draftGenerate: {
      draftTextPrefix: "世界草稿脚手架占位内容",
      outline: ["核心前提", "主要阵营", "标志地点", "规则约束"],
      referenceNotes: {
        searchEnabled: "搜索 provider 集成已预留，但当前还未真正接通。",
        localOnly: "当前启用的是仅本地草稿生成脚手架。",
      },
    },
    draftRefine: {
      draftTextPrefix: "草稿细化脚手架占位内容",
      outline: ["更新后的前提", "调整后的阵营", "修订备注"],
      referenceNotes: ["细化管线合同已经准备好，等待后续接入 provider。"],
    },
    session: {
      defaultTitle: "新会话",
    },
    chat: {
      assistantMessage:
        "脚手架回复：下一步会把记忆引擎、检索层和模型适配器真正接到这里。",
    },
  },
} as const satisfies Record<AppLocale, ApiScaffoldCopy>

export const apiScaffoldCopy = apiScaffoldCopyByLocale[defaultLocale]

export function getApiScaffoldCopy(locale: AppLocale) {
  return apiScaffoldCopyByLocale[locale]
}
