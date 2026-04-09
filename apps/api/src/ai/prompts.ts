import type { AppLocale } from "@worldweaver/config"
import { z } from "zod"
import type {
  StoredChatMessage,
  StoredDraftVersion,
  StoredWorld,
} from "../repositories/local-state.js"

export const draftProviderOutputSchema = z.object({
  draft_text: z.string().min(1),
  outline: z.array(z.string().min(1)).min(3).max(6),
  reference_notes: z.array(z.string().min(1)).min(1).max(5),
})

export const chatProviderOutputSchema = z.object({
  assistant_message: z.string().min(1),
})

function getLocaleLabel(locale: AppLocale) {
  return locale === "zh-CN" ? "Simplified Chinese" : "English"
}

function serializeMessages(messages: StoredChatMessage[]) {
  if (messages.length === 0) {
    return "No previous turns."
  }

  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n")
}

export function buildDraftGeneratePrompt(input: {
  locale: AppLocale
  basePrompt: string
  enableSearch: boolean
}) {
  const language = getLocaleLabel(input.locale)

  return {
    instructions: [
      "You are the WorldWeaver worldbuilding engine.",
      `Write all output in ${language}.`,
      "Return a valid JSON object only.",
      "Required JSON shape:",
      '{ "draft_text": string, "outline": string[], "reference_notes": string[] }',
      "draft_text should feel like a playable setting overview, not bullet notes.",
      "outline should contain 3 to 6 short chapter-like items.",
      "reference_notes should mention source assumptions and next-step creative hooks.",
    ].join("\n"),
    input: [
      `Base prompt: ${input.basePrompt}`,
      `External search enabled: ${input.enableSearch ? "yes" : "no"}`,
    ].join("\n"),
    context: {
      base_prompt: input.basePrompt,
      enable_search: input.enableSearch,
    },
  }
}

export function buildDraftRefinePrompt(input: {
  locale: AppLocale
  currentDraftVersion: StoredDraftVersion
  userFeedback: string
}) {
  const language = getLocaleLabel(input.locale)

  return {
    instructions: [
      "You are the WorldWeaver worldbuilding refinement engine.",
      `Write all output in ${language}.`,
      "Return a valid JSON object only.",
      "Required JSON shape:",
      '{ "draft_text": string, "outline": string[], "reference_notes": string[] }',
      "Honor the user's feedback while preserving the strongest details from the current draft.",
    ].join("\n"),
    input: [
      `Current draft: ${input.currentDraftVersion.draft_text}`,
      `Current outline: ${input.currentDraftVersion.outline.join(" | ")}`,
      `User feedback: ${input.userFeedback}`,
    ].join("\n"),
    context: {
      base_prompt: input.currentDraftVersion.base_prompt,
      current_draft_text: input.currentDraftVersion.draft_text,
      user_feedback: input.userFeedback,
    },
  }
}

export function buildChatPrompt(input: {
  locale: AppLocale
  world: StoredWorld
  sessionTitle: string
  recentMessages: StoredChatMessage[]
  userMessage: string
  retrievedContexts: string[]
}) {
  const language = getLocaleLabel(input.locale)

  return {
    instructions: [
      "You are the WorldWeaver session narrator.",
      `Write all output in ${language}.`,
      "Return a valid JSON object only.",
      'Required JSON shape: { "assistant_message": string }',
      "The assistant_message should move the scene forward, reference the world's tone, and stay concise but flavorful.",
      "Use retrieved context when available, but do not repeat it verbatim.",
    ].join("\n"),
    input: [
      `World: ${input.world.world_name}`,
      `Theme: ${input.world.theme}`,
      `Session title: ${input.sessionTitle}`,
      `Retrieved context: ${
        input.retrievedContexts.length > 0
          ? input.retrievedContexts.join(" || ")
          : "none"
      }`,
      "Recent conversation:",
      serializeMessages(input.recentMessages),
      `Current player move: ${input.userMessage}`,
    ].join("\n"),
    context: {
      world_name: input.world.world_name,
      world_theme: input.world.theme,
      session_title: input.sessionTitle,
      user_message: input.userMessage,
      retrieved_contexts: input.retrievedContexts,
    },
  }
}
