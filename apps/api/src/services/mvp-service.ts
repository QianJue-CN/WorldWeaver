import {
  type AppLocale,
  getApiScaffoldCopy,
  sessionUpdateJobIds,
  worldCommitJobIds,
} from "@worldweaver/config"
import type {
  ChatSendRequest,
  ChatSendResponse,
  CommitWorldRequest,
  CommitWorldResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  DraftGenerateRequest,
  DraftGenerateResponse,
  DraftRefineRequest,
  DraftRefineResponse,
} from "@worldweaver/contracts"
import type { AiGateway } from "../ai/ai-gateway.js"
import {
  buildChatPrompt,
  buildDraftGeneratePrompt,
  buildDraftRefinePrompt,
  chatProviderOutputSchema,
  draftProviderOutputSchema,
} from "../ai/prompts.js"
import { selectTopContexts } from "../ai/retrieval.js"
import { ApiRouteError, notFoundError } from "../lib/api-error.js"
import type {
  LocalStateRepository,
  StoredChatMessage,
  StoredDraft,
  StoredDraftVersion,
  StoredEmbedding,
  StoredEmbeddingJob,
  StoredSession,
  StoredWorld,
} from "../repositories/local-state.js"

type MvpServiceOptions = {
  createId?: () => string
  now?: () => Date
}

function slugify(value: string) {
  const normalized = value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "_")
    .replace(/^_+|_+$/g, "")

  return normalized || "worldweaver"
}

type EmbeddingFailure = {
  code: string
  message: string
}

function readEmbeddingFailure(error: unknown): EmbeddingFailure {
  if (error instanceof ApiRouteError) {
    return {
      code: error.code,
      message: error.message,
    }
  }

  if (error instanceof Error) {
    return {
      code: "embedding_error",
      message: error.message,
    }
  }

  return {
    code: "embedding_error",
    message: "Unknown embedding failure.",
  }
}

export class MvpService {
  private readonly createId: () => string
  private readonly now: () => Date

  constructor(
    private readonly repository: LocalStateRepository,
    private readonly aiGateway: AiGateway,
    options: MvpServiceOptions = {},
  ) {
    this.createId = options.createId ?? (() => crypto.randomUUID().slice(0, 8))
    this.now = options.now ?? (() => new Date())
  }

  async generateDraft(
    input: DraftGenerateRequest,
    locale: AppLocale,
  ): Promise<DraftGenerateResponse> {
    const prompt = buildDraftGeneratePrompt({
      locale,
      basePrompt: input.base_prompt,
      enableSearch: input.enable_search,
    })
    const generated = await this.aiGateway.generateObject({
      providerConfigId: input.provider_config_id,
      task: "draft_generate",
      locale,
      instructions: prompt.instructions,
      input: prompt.input,
      schema: draftProviderOutputSchema,
      temperature: 0.7,
      context: prompt.context,
    })

    return this.repository.mutate((state) => {
      const timestamp = this.now().toISOString()
      const version = this.createDraftVersion({
        basePrompt: input.base_prompt,
        userFeedback: null,
        draftText: generated.object.draft_text,
        outline: generated.object.outline,
        referenceNotes: generated.object.reference_notes,
        createdAt: timestamp,
      })

      const draftId = this.createSeededId("draft", input.base_prompt)
      const draft: StoredDraft = {
        draft_id: draftId,
        base_prompt: input.base_prompt,
        enable_search: input.enable_search,
        provider_config_id: input.provider_config_id,
        status: "draft",
        current_version_no: version.version_no,
        versions: [version],
        created_at: timestamp,
        updated_at: timestamp,
      }

      state.drafts[draftId] = draft

      return this.toDraftResponse(draft)
    })
  }

  async refineDraft(
    input: DraftRefineRequest,
    locale: AppLocale,
  ): Promise<DraftRefineResponse> {
    const draft = await this.repository.read(
      (state) => state.drafts[input.draft_id],
    )

    if (!draft) {
      throw notFoundError("draft", input.draft_id)
    }

    const currentVersion = draft.versions.at(-1)

    if (!currentVersion) {
      throw new Error(`Draft ${draft.draft_id} has no versions`)
    }

    const prompt = buildDraftRefinePrompt({
      locale,
      currentDraftVersion: currentVersion,
      userFeedback: input.user_feedback,
    })
    const refined = await this.aiGateway.generateObject({
      providerConfigId: input.provider_config_id,
      task: "draft_refine",
      locale,
      instructions: prompt.instructions,
      input: prompt.input,
      schema: draftProviderOutputSchema,
      temperature: 0.5,
      context: prompt.context,
    })

    return this.repository.mutate((state) => {
      const nextDraft = state.drafts[input.draft_id]

      if (!nextDraft) {
        throw notFoundError("draft", input.draft_id)
      }

      const timestamp = this.now().toISOString()
      const nextVersion = this.createDraftVersion({
        basePrompt: nextDraft.base_prompt,
        userFeedback: input.user_feedback,
        draftText: refined.object.draft_text,
        outline: refined.object.outline,
        referenceNotes: refined.object.reference_notes,
        createdAt: timestamp,
        versionNo: nextDraft.current_version_no + 1,
      })

      nextDraft.provider_config_id = input.provider_config_id
      nextDraft.current_version_no = nextVersion.version_no
      nextDraft.updated_at = timestamp
      nextDraft.versions.push(nextVersion)

      return this.toDraftResponse(nextDraft)
    })
  }

  async commitWorld(
    input: CommitWorldRequest,
    _locale: AppLocale,
  ): Promise<CommitWorldResponse> {
    const draft = await this.repository.read(
      (state) => state.drafts[input.draft_id],
    )

    if (!draft) {
      throw notFoundError("draft", input.draft_id)
    }

    const currentVersion = draft.versions.at(-1)

    if (!currentVersion) {
      throw new Error(`Draft ${draft.draft_id} has no versions`)
    }

    let embeddingResult:
      | {
          provider: "openai" | "gemini" | "mock"
          model: string
          vector: number[]
        }
      | undefined
    let embeddingFailure: EmbeddingFailure | undefined

    try {
      embeddingResult = await this.aiGateway.embedText({
        providerConfigId: draft.provider_config_id,
        input: currentVersion.draft_text,
        purpose: "document",
      })
    } catch (error) {
      embeddingFailure = readEmbeddingFailure(error)
    }

    return this.repository.mutate((state) => {
      const nextDraft = state.drafts[input.draft_id]

      if (!nextDraft) {
        throw notFoundError("draft", input.draft_id)
      }

      const timestamp = this.now().toISOString()
      const worldId = this.createSeededId("world", input.world_name)
      const world: StoredWorld = {
        world_id: worldId,
        draft_id: nextDraft.draft_id,
        source_draft_version_no: nextDraft.current_version_no,
        provider_config_id: nextDraft.provider_config_id,
        world_name: input.world_name,
        theme: input.theme,
        status: "processing",
        queued_jobs: [...worldCommitJobIds],
        created_at: timestamp,
        updated_at: timestamp,
      }

      state.worlds[worldId] = world

      this.persistEmbeddingResult({
        state,
        timestamp,
        worldId,
        sessionId: null,
        sourceType: "world_draft",
        sourceId: nextDraft.draft_id,
        providerConfigId: nextDraft.provider_config_id,
        content: currentVersion.draft_text,
        embeddingResult,
        embeddingFailure,
      })

      return {
        world_id: world.world_id,
        status: world.status,
        queued_jobs: [...world.queued_jobs],
      }
    })
  }

  async createSession(
    input: CreateSessionRequest,
    locale: AppLocale,
  ): Promise<CreateSessionResponse> {
    const copy = getApiScaffoldCopy(locale)

    return this.repository.mutate((state) => {
      const world = state.worlds[input.world_id]

      if (!world) {
        throw notFoundError("world", input.world_id)
      }

      const timestamp = this.now().toISOString()
      const title = input.title ?? copy.session.defaultTitle
      const sessionId = this.createRecordId("session")
      const session: StoredSession = {
        session_id: sessionId,
        world_id: world.world_id,
        user_id: input.user_id,
        title,
        status: "active",
        messages: [],
        created_at: timestamp,
        updated_at: timestamp,
      }

      state.sessions[sessionId] = session

      return {
        session_id: session.session_id,
        world_id: session.world_id,
        title: session.title,
        status: session.status,
      }
    })
  }

  async sendChat(
    input: ChatSendRequest,
    locale: AppLocale,
  ): Promise<ChatSendResponse> {
    const chatContext = await this.repository.read((state) => {
      const session = state.sessions[input.session_id]

      if (!session) {
        throw notFoundError("session", input.session_id)
      }

      const world = state.worlds[session.world_id]

      if (!world) {
        throw notFoundError("world", session.world_id)
      }

      const candidates = Object.values(state.embeddings).filter(
        (embedding) =>
          embedding.world_id === world.world_id &&
          embedding.provider_config_id === input.provider_config_id &&
          (embedding.session_id === null ||
            embedding.session_id === session.session_id),
      )

      return {
        session,
        world,
        recentMessages: session.messages.slice(-6),
        candidates,
      }
    })

    let retrievedContexts: string[] = []

    try {
      const queryEmbedding = await this.aiGateway.embedText({
        providerConfigId: input.provider_config_id,
        input: input.user_message,
        purpose: "query",
      })

      retrievedContexts = selectTopContexts({
        queryVector: queryEmbedding.vector,
        candidates: chatContext.candidates,
        limit: 2,
      })
    } catch {
      retrievedContexts = []
    }

    const prompt = buildChatPrompt({
      locale,
      world: chatContext.world,
      sessionTitle: chatContext.session.title,
      recentMessages: chatContext.recentMessages,
      userMessage: input.user_message,
      retrievedContexts,
    })
    const generated = await this.aiGateway.generateObject({
      providerConfigId: input.provider_config_id,
      task: "chat_reply",
      locale,
      instructions: prompt.instructions,
      input: prompt.input,
      schema: chatProviderOutputSchema,
      temperature: 0.8,
      context: prompt.context,
    })

    const turnEmbeddingText = [
      `Player: ${input.user_message}`,
      `Assistant: ${generated.object.assistant_message}`,
    ].join("\n")

    let turnEmbeddingResult:
      | {
          provider: "openai" | "gemini" | "mock"
          model: string
          vector: number[]
        }
      | undefined
    let turnEmbeddingFailure: EmbeddingFailure | undefined

    try {
      turnEmbeddingResult = await this.aiGateway.embedText({
        providerConfigId: input.provider_config_id,
        input: turnEmbeddingText,
        purpose: "document",
      })
    } catch (error) {
      turnEmbeddingFailure = readEmbeddingFailure(error)
    }

    return this.repository.mutate((state) => {
      const session = state.sessions[input.session_id]

      if (!session) {
        throw notFoundError("session", input.session_id)
      }

      const timestamp = this.now().toISOString()
      const assistantMessage = generated.object.assistant_message
      const playerMessageRecord = this.createChatMessage({
        role: "user",
        content: input.user_message,
        providerConfigId: input.provider_config_id,
        createdAt: timestamp,
      })
      const assistantMessageRecord = this.createChatMessage({
        role: "assistant",
        content: assistantMessage,
        providerConfigId: input.provider_config_id,
        createdAt: timestamp,
      })

      session.messages.push(playerMessageRecord, assistantMessageRecord)
      session.updated_at = timestamp

      this.persistEmbeddingResult({
        state,
        timestamp,
        worldId: session.world_id,
        sessionId: session.session_id,
        sourceType: "session_turn",
        sourceId: assistantMessageRecord.message_id,
        providerConfigId: input.provider_config_id,
        content: turnEmbeddingText,
        embeddingResult: turnEmbeddingResult,
        embeddingFailure: turnEmbeddingFailure,
      })

      return {
        session_id: session.session_id,
        assistant_message: assistantMessage,
        queued_jobs: [...sessionUpdateJobIds],
      }
    })
  }

  private persistEmbeddingResult(input: {
    state: {
      embeddings: Record<string, StoredEmbedding>
      embedding_jobs: Record<string, StoredEmbeddingJob>
    }
    timestamp: string
    worldId: string
    sessionId: string | null
    sourceType: "world_draft" | "session_turn"
    sourceId: string
    providerConfigId: string
    content: string
    embeddingResult:
      | {
          provider: "openai" | "gemini" | "mock"
          model: string
          vector: number[]
        }
      | undefined
    embeddingFailure: EmbeddingFailure | undefined
  }) {
    const jobId = this.createRecordId("embedding_job")

    if (input.embeddingResult) {
      const embeddingId = this.createRecordId("embedding")

      input.state.embeddings[embeddingId] = {
        embedding_id: embeddingId,
        world_id: input.worldId,
        session_id: input.sessionId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        provider_config_id: input.providerConfigId,
        provider: input.embeddingResult.provider,
        model: input.embeddingResult.model,
        content: input.content,
        vector: input.embeddingResult.vector,
        dimensions: input.embeddingResult.vector.length,
        created_at: input.timestamp,
      }

      input.state.embedding_jobs[jobId] = {
        job_id: jobId,
        world_id: input.worldId,
        session_id: input.sessionId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        provider_config_id: input.providerConfigId,
        status: "done",
        embedding_id: embeddingId,
        error_code: null,
        error_message: null,
        created_at: input.timestamp,
        updated_at: input.timestamp,
      }

      return
    }

    if (input.embeddingFailure) {
      input.state.embedding_jobs[jobId] = {
        job_id: jobId,
        world_id: input.worldId,
        session_id: input.sessionId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        provider_config_id: input.providerConfigId,
        status: "failed",
        embedding_id: null,
        error_code: input.embeddingFailure.code,
        error_message: input.embeddingFailure.message,
        created_at: input.timestamp,
        updated_at: input.timestamp,
      }
    }
  }

  private createDraftVersion(input: {
    basePrompt: string
    userFeedback: string | null
    draftText: string
    outline: string[]
    referenceNotes: string[]
    createdAt: string
    versionNo?: number
  }): StoredDraftVersion {
    return {
      version_no: input.versionNo ?? 1,
      base_prompt: input.basePrompt,
      user_feedback: input.userFeedback,
      draft_text: input.draftText,
      outline: input.outline,
      reference_notes: input.referenceNotes,
      created_at: input.createdAt,
    }
  }

  private toDraftResponse(draft: StoredDraft): DraftGenerateResponse {
    const currentVersion = draft.versions.at(-1)

    if (!currentVersion) {
      throw new Error(`Draft ${draft.draft_id} has no versions`)
    }

    return {
      draft_id: draft.draft_id,
      draft_text: currentVersion.draft_text,
      outline: [...currentVersion.outline],
      reference_notes: [...currentVersion.reference_notes],
      status: draft.status,
    }
  }

  private createChatMessage(input: {
    role: StoredChatMessage["role"]
    content: string
    providerConfigId: string
    createdAt: string
  }): StoredChatMessage {
    return {
      message_id: this.createRecordId("message"),
      role: input.role,
      content: input.content,
      provider_config_id: input.providerConfigId,
      created_at: input.createdAt,
    }
  }

  private createRecordId(prefix: string) {
    return `${prefix}_${this.createId()}`
  }

  private createSeededId(prefix: string, seed: string) {
    const slug = slugify(seed).slice(0, 24)

    return `${prefix}_${slug}_${this.createId()}`
  }
}
