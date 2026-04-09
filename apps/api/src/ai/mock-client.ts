import type { AppLocale } from "@worldweaver/config"
import type { ResolvedEmbeddingProvider } from "./provider-registry.js"

type MockTask = "draft_generate" | "draft_refine" | "chat_reply"

type MockGenerationRequest = {
  task: MockTask
  locale: AppLocale
  context?: Record<string, unknown>
}

function createOutline(locale: AppLocale, seed: string) {
  if (locale === "zh-CN") {
    return [
      `核心设定：${seed}`,
      "势力关系：关键组织与冲突已经成形。",
      "标志地点：至少包含一个玩家可直接进入的热点场景。",
      "风险线索：保留一个能推动剧情升级的隐患。",
    ]
  }

  return [
    `Core premise: ${seed}`,
    "Faction pressure: establish at least one unstable power balance.",
    "Signature location: anchor the world with a playable hotspot.",
    "Escalation hook: leave one pressure point ready for conflict.",
  ]
}

function createDeterministicVector(input: string, dimensions: number) {
  const vector = Array.from({ length: dimensions }, () => 0)

  for (const [index, character] of Array.from(input).entries()) {
    const bucket = index % dimensions

    vector[bucket] = (vector[bucket] ?? 0) + (character.codePointAt(0) ?? 0)
  }

  const magnitude = Math.sqrt(
    vector.reduce((total, value) => total + value * value, 0),
  )

  if (magnitude === 0) {
    return vector
  }

  return vector.map((value) => Number((value / magnitude).toFixed(6)))
}

export class MockClient {
  constructor(private readonly embeddingProvider: ResolvedEmbeddingProvider) {}

  async generateJson(request: MockGenerationRequest) {
    const context = request.context ?? {}

    if (request.task === "draft_generate") {
      const basePrompt = String(context.base_prompt ?? "WorldWeaver frontier")

      return JSON.stringify({
        draft_text:
          request.locale === "zh-CN"
            ? `本地 Mock 草稿：${basePrompt}。这个版本专注于让世界立即可玩，并保留一个可以继续细化的冲突核心。`
            : `Local mock draft: ${basePrompt}. This version keeps the world immediately playable and leaves one conflict axis ready for refinement.`,
        outline: createOutline(request.locale, basePrompt),
        reference_notes:
          request.locale === "zh-CN"
            ? [
                "本地 Mock provider 已接管文本生成。",
                context.enable_search
                  ? "搜索备注已启用，但当前仍为离线模拟。"
                  : "当前为纯本地离线生成。",
              ]
            : [
                "The local mock provider handled this draft generation.",
                context.enable_search
                  ? "Search notes are enabled, but this response stays offline."
                  : "This response is fully local and offline.",
              ],
      })
    }

    if (request.task === "draft_refine") {
      const feedback = String(context.user_feedback ?? "Tighten the conflict.")
      const currentText = String(context.current_draft_text ?? "")

      return JSON.stringify({
        draft_text:
          request.locale === "zh-CN"
            ? `本地 Mock 细化：${currentText}\n\n根据反馈补强：${feedback}`
            : `Local mock refinement: ${currentText}\n\nReinforced with feedback: ${feedback}`,
        outline: createOutline(
          request.locale,
          String(context.base_prompt ?? "Refined frontier"),
        ),
        reference_notes:
          request.locale === "zh-CN"
            ? ["本地 Mock provider 已应用本轮细化反馈。"]
            : [
                "The local mock provider applied the latest refinement feedback.",
              ],
      })
    }

    const worldName = String(context.world_name ?? "Unknown World")
    const worldTheme = String(context.world_theme ?? "Unknown theme")
    const sessionTitle = String(context.session_title ?? "New Session")
    const userMessage = String(context.user_message ?? "Hello world")
    const retrievedContext = Array.isArray(context.retrieved_contexts)
      ? context.retrieved_contexts
      : []

    return JSON.stringify({
      assistant_message:
        request.locale === "zh-CN"
          ? [
              `本地 Mock 回复：你在「${sessionTitle}」中继续探索《${worldName}》。`,
              `当前世界主题是：${worldTheme}。`,
              retrievedContext.length > 0
                ? `已检索上下文：${retrievedContext.join(" / ")}`
                : "当前没有额外检索上下文，因此仅根据现有会话推进。",
              `针对玩家动作「${userMessage}」，叙事会向更清晰的风险与机会展开。`,
            ].join("\n\n")
          : [
              `Local mock reply: you keep exploring ${worldName} inside "${sessionTitle}".`,
              `Current world theme: ${worldTheme}.`,
              retrievedContext.length > 0
                ? `Retrieved context: ${retrievedContext.join(" / ")}`
                : "No additional retrieved context was available, so the reply leans on live session state only.",
              `For the player move "${userMessage}", the scene now sharpens into a clearer blend of risk and opportunity.`,
            ].join("\n\n"),
    })
  }

  async embedText(input: string) {
    return {
      vector: createDeterministicVector(
        input,
        this.embeddingProvider.dimensions ?? 24,
      ),
      model: this.embeddingProvider.embeddingModel,
    }
  }
}
