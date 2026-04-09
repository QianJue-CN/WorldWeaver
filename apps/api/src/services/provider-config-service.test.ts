import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { providerRuntimeDefaults } from "@worldweaver/config"
import { ProviderRegistry } from "../ai/provider-registry.js"
import type { ApiEnv } from "../lib/env.js"
import { LocalStateRepository } from "../repositories/local-state.js"
import { ProviderConfigService } from "./provider-config-service.js"

function createTestEnv() {
  return {
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
}

test("ProviderConfigService creates, updates, lists, and deletes player provider configs", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "worldweaver-provider-"))
  const stateFilePath = join(directory, "state.json")
  const repository = new LocalStateRepository({ stateFilePath })
  const registry = new ProviderRegistry(repository, createTestEnv())
  const service = new ProviderConfigService(repository, registry, {
    createId: () => "custom01",
    now: () => new Date("2026-04-10T01:00:00.000Z"),
  })

  t.after(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  const created = await service.upsertConfig(
    {
      owner_id: "player_local",
      label: "Personal OpenAI",
      provider: "openai",
      api_base_url: "https://api.openai.com/v1",
      api_key: "sk-test-1234567890",
      text_model: "gpt-4.1-mini",
      embedding_model: "text-embedding-3-small",
      is_default: true,
    },
    "en",
  )

  assert.equal(created.source, "user")
  assert.equal(created.is_default, true)
  assert.equal(created.provider_config_id, "user_provider_custom01")
  assert.match(created.api_key_preview ?? "", /sk-t/)

  const updated = await service.upsertConfig(
    {
      provider_config_id: created.provider_config_id,
      owner_id: "player_local",
      label: "Updated OpenAI",
      provider: "openai",
      api_base_url: "https://api.openai.com/v1",
      text_model: "gpt-4.1-mini",
      embedding_model: "text-embedding-3-small",
      is_default: true,
    },
    "en",
  )

  assert.equal(updated.label, "Updated OpenAI")
  assert.match(updated.api_key_preview ?? "", /sk-t/)

  const listed = await service.listConfigs("player_local", "en")

  assert.equal(listed.active_provider_config_id, created.provider_config_id)
  assert.ok(
    listed.items.some(
      (item) =>
        item.provider_config_id === created.provider_config_id &&
        item.label === "Updated OpenAI",
    ),
  )
  assert.ok(
    listed.items.some((item) => item.provider_config_id === "cfg_mock_local"),
  )

  const deleted = await service.deleteConfig(
    "player_local",
    created.provider_config_id,
  )

  assert.deepEqual(deleted, {
    provider_config_id: created.provider_config_id,
    deleted: true,
  })

  const afterDelete = await service.listConfigs("player_local", "en")

  assert.equal(afterDelete.active_provider_config_id, "cfg_mock_local")
  assert.equal(
    afterDelete.items.some(
      (item) => item.provider_config_id === created.provider_config_id,
    ),
    false,
  )
})
