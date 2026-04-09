import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import {
  providerRuntimeDefaults,
  sessionUpdateJobIds,
  worldCommitJobIds,
} from "@worldweaver/config"
import { AiGateway } from "../ai/ai-gateway.js"
import { ProviderRegistry } from "../ai/provider-registry.js"
import { ApiRouteError } from "../lib/api-error.js"
import type { ApiEnv } from "../lib/env.js"
import { LocalStateRepository } from "../repositories/local-state.js"
import { MvpService } from "./mvp-service.js"

function createIdSequence(values: string[]) {
  let index = 0

  return () => {
    const nextValue = values[index]

    index += 1

    return nextValue ?? `generated_${index}`
  }
}

function createTestGateway(repository: LocalStateRepository) {
  const env = {
    NODE_ENV: "test",
    API_HOST: "127.0.0.1",
    API_PORT: 4000,
    API_ALLOWED_ORIGINS: "http://localhost:3000",
    POSTGRES_URL: "postgresql://localhost/worldweaver",
    REDIS_URL: "redis://localhost:6379",
    QDRANT_URL: "http://localhost:6333",
    OPENAI_BASE_URL: providerRuntimeDefaults.openAiBaseUrl,
    OPENAI_TEXT_MODEL: providerRuntimeDefaults.openAiTextModel,
    OPENAI_EMBEDDING_MODEL: providerRuntimeDefaults.openAiEmbeddingModel,
    OPENAI_TIMEOUT_MS: providerRuntimeDefaults.openAiTimeoutMs,
    MOCK_EMBEDDING_DIMENSIONS: providerRuntimeDefaults.mockEmbeddingDimensions,
  } as ApiEnv

  return new AiGateway(new ProviderRegistry(repository, env))
}

test("MvpService persists draft, world, session, and chat state across repository instances", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "worldweaver-api-"))
  const stateFilePath = join(directory, "state.json")

  t.after(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  const firstRepository = new LocalStateRepository({ stateFilePath })
  const firstService = new MvpService(
    firstRepository,
    createTestGateway(firstRepository),
    {
      createId: createIdSequence([
        "draft01",
        "world01",
        "embedding01",
        "job01",
      ]),
      now: () => new Date("2026-04-10T00:00:00.000Z"),
    },
  )

  const draft = await firstService.generateDraft(
    {
      base_prompt: "Clockwork city beneath a red moon",
      enable_search: true,
      provider_config_id: "cfg_mock_local",
    },
    "en",
  )

  assert.equal(draft.draft_id, "draft_clockwork_city_beneath_a_draft01")
  assert.match(draft.draft_text, /Clockwork city beneath a red moon/)

  const refinedDraft = await firstService.refineDraft(
    {
      draft_id: draft.draft_id,
      user_feedback: "Push the guild politics into the foreground.",
      provider_config_id: "cfg_mock_local",
    },
    "en",
  )

  assert.match(
    refinedDraft.draft_text,
    /Push the guild politics into the foreground\./,
  )

  const committedWorld = await firstService.commitWorld(
    {
      draft_id: draft.draft_id,
      world_name: "Crimson Clockwork",
      theme: "Gothic intrigue",
    },
    "en",
  )

  assert.deepEqual(committedWorld.queued_jobs, [...worldCommitJobIds])

  const secondRepository = new LocalStateRepository({ stateFilePath })
  const secondService = new MvpService(
    secondRepository,
    createTestGateway(secondRepository),
    {
      createId: createIdSequence([
        "session01",
        "message01",
        "message02",
        "embedding02",
        "job02",
      ]),
      now: () => new Date("2026-04-10T00:05:00.000Z"),
    },
  )

  const session = await secondService.createSession(
    {
      world_id: committedWorld.world_id,
      user_id: "player_001",
      title: "Archive Breach",
    },
    "en",
  )

  const chat = await secondService.sendChat(
    {
      session_id: session.session_id,
      user_message: "I bribe the elevator keeper for a silent descent.",
      provider_config_id: "cfg_mock_local",
    },
    "en",
  )

  assert.deepEqual(chat.queued_jobs, [...sessionUpdateJobIds])
  assert.match(chat.assistant_message, /Archive Breach/)
  assert.match(chat.assistant_message, /Crimson Clockwork/)
  assert.match(chat.assistant_message, /I bribe the elevator keeper/)

  const snapshot = await secondRepository.read((state) => state)
  const persistedSession = snapshot.sessions[session.session_id]

  assert.ok(persistedSession)
  assert.equal(persistedSession.messages.length, 2)
  assert.equal(persistedSession.messages[0]?.role, "user")
  assert.equal(persistedSession.messages[1]?.role, "assistant")
  assert.equal(Object.keys(snapshot.embeddings).length, 2)
  assert.equal(Object.keys(snapshot.embedding_jobs).length, 2)
})

test("MvpService raises consistent missing-entity errors", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "worldweaver-api-"))
  const stateFilePath = join(directory, "state.json")
  const repository = new LocalStateRepository({ stateFilePath })
  const service = new MvpService(repository, createTestGateway(repository))

  t.after(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  await assert.rejects(
    () =>
      service.refineDraft(
        {
          draft_id: "draft_missing",
          user_feedback: "Refine this world.",
          provider_config_id: "cfg_mock_local",
        },
        "en",
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApiRouteError)
      assert.equal(error.statusCode, 404)
      assert.equal(error.code, "draft_not_found")

      return true
    },
  )

  await assert.rejects(
    () =>
      service.createSession(
        {
          world_id: "world_missing",
          user_id: "player_001",
        },
        "en",
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApiRouteError)
      assert.equal(error.statusCode, 404)
      assert.equal(error.code, "world_not_found")

      return true
    },
  )

  await assert.rejects(
    () =>
      service.sendChat(
        {
          session_id: "session_missing",
          user_message: "Hello?",
          provider_config_id: "cfg_mock_local",
        },
        "en",
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApiRouteError)
      assert.equal(error.statusCode, 404)
      assert.equal(error.code, "session_not_found")

      return true
    },
  )
})
