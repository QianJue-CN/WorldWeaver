import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export type StoredDraftVersion = {
  version_no: number
  base_prompt: string
  user_feedback: string | null
  draft_text: string
  outline: string[]
  reference_notes: string[]
  created_at: string
}

export type StoredProviderConfig = {
  provider_config_id: string
  owner_id: string
  label: string
  provider: "openai" | "gemini" | "anthropic"
  api_base_url: string
  api_key: string
  text_model: string
  embedding_model: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export type StoredDraft = {
  draft_id: string
  base_prompt: string
  enable_search: boolean
  provider_config_id: string
  status: "draft"
  current_version_no: number
  versions: StoredDraftVersion[]
  created_at: string
  updated_at: string
}

export type StoredWorld = {
  world_id: string
  draft_id: string
  source_draft_version_no: number
  provider_config_id: string
  world_name: string
  theme: string
  status: "processing"
  queued_jobs: string[]
  created_at: string
  updated_at: string
}

export type StoredChatMessage = {
  message_id: string
  role: "user" | "assistant"
  content: string
  provider_config_id: string | null
  created_at: string
}

export type StoredSession = {
  session_id: string
  world_id: string
  user_id: string
  title: string
  status: "active"
  messages: StoredChatMessage[]
  created_at: string
  updated_at: string
}

export type StoredEmbedding = {
  embedding_id: string
  world_id: string
  session_id: string | null
  source_type: "world_draft" | "session_turn"
  source_id: string
  provider_config_id: string
  provider: "openai" | "gemini" | "mock"
  model: string
  content: string
  vector: number[]
  dimensions: number
  created_at: string
}

export type StoredEmbeddingJob = {
  job_id: string
  world_id: string
  session_id: string | null
  source_type: "world_draft" | "session_turn"
  source_id: string
  provider_config_id: string
  status: "done" | "failed"
  embedding_id: string | null
  error_code: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export type WorldWeaverLocalState = {
  drafts: Record<string, StoredDraft>
  worlds: Record<string, StoredWorld>
  sessions: Record<string, StoredSession>
  embeddings: Record<string, StoredEmbedding>
  embedding_jobs: Record<string, StoredEmbeddingJob>
  provider_configs: Record<string, StoredProviderConfig>
}

type LocalStateRepositoryOptions = {
  stateFilePath?: string
}

function findAncestor(startDirectory: string, marker: string) {
  let currentDirectory = startDirectory

  while (true) {
    if (existsSync(resolve(currentDirectory, marker))) {
      return currentDirectory
    }

    const parentDirectory = resolve(currentDirectory, "..")

    if (parentDirectory === currentDirectory) {
      throw new Error(`Unable to find ${marker} from ${startDirectory}`)
    }

    currentDirectory = parentDirectory
  }
}

function resolveDefaultStateFilePath(metaUrl: string) {
  const moduleDirectory = dirname(fileURLToPath(metaUrl))
  const repoRoot = findAncestor(moduleDirectory, "pnpm-workspace.yaml")

  return resolve(repoRoot, ".tmp", "worldweaver-api-state.json")
}

function createEmptyState(): WorldWeaverLocalState {
  return {
    drafts: {},
    worlds: {},
    sessions: {},
    embeddings: {},
    embedding_jobs: {},
    provider_configs: {},
  }
}

export class LocalStateRepository {
  private readonly stateFilePath: string
  private cachedState: WorldWeaverLocalState | null = null
  private mutationQueue = Promise.resolve()

  constructor(options: LocalStateRepositoryOptions = {}) {
    this.stateFilePath =
      options.stateFilePath ?? resolveDefaultStateFilePath(import.meta.url)
  }

  async read<T>(reader: (state: WorldWeaverLocalState) => T | Promise<T>) {
    const state = structuredClone(await this.loadState())

    return reader(state)
  }

  async mutate<T>(
    mutator: (state: WorldWeaverLocalState) => T | Promise<T>,
  ): Promise<T> {
    const operation = this.mutationQueue.then(async () => {
      const nextState = structuredClone(await this.loadState())
      const result = await mutator(nextState)
      await this.persistState(nextState)
      this.cachedState = nextState

      return result
    })

    this.mutationQueue = operation.then(
      () => undefined,
      () => undefined,
    )

    return operation
  }

  private async loadState() {
    if (this.cachedState) {
      return this.cachedState
    }

    try {
      const contents = await readFile(this.stateFilePath, "utf8")
      this.cachedState = JSON.parse(contents) as WorldWeaverLocalState
    } catch (error) {
      const fileReadFailed =
        error instanceof Error &&
        "code" in error &&
        typeof error.code === "string" &&
        error.code === "ENOENT"

      if (!fileReadFailed) {
        throw error
      }

      this.cachedState = createEmptyState()
    }

    return this.cachedState
  }

  private async persistState(state: WorldWeaverLocalState) {
    await mkdir(dirname(this.stateFilePath), { recursive: true })
    await writeFile(this.stateFilePath, JSON.stringify(state, null, 2), "utf8")
  }
}
