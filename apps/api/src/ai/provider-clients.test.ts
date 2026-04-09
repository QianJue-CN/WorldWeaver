import assert from "node:assert/strict"
import test from "node:test"
import { AnthropicClient } from "./anthropic-client.js"
import { GeminiClient } from "./gemini-client.js"
import { OpenAiCompatibleClient } from "./openai-compatible-client.js"

test("OpenAiCompatibleClient calls chat completions and embeddings", async () => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = []
  const fetchMock: typeof fetch = async (input, init) => {
    const url = String(input)

    requests.push({ url, init })

    if (url.endsWith("/chat/completions")) {
      return new Response(
        JSON.stringify({
          model: "gpt-4.1-mini",
          choices: [
            {
              message: {
                content:
                  '{"draft_text":"ok","outline":["one","two","three"],"reference_notes":["local"]}',
              },
            },
          ],
        }),
      )
    }

    return new Response(
      JSON.stringify({
        model: "text-embedding-3-small",
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      }),
    )
  }

  const client = new OpenAiCompatibleClient(
    {
      id: "cfg_openai_default",
      label: "OpenAI default",
      provider: "openai",
      apiBaseUrl: "https://api.openai.com/v1",
      apiKey: "sk-test",
      textModel: "gpt-4.1-mini",
      timeoutMs: 45000,
      organization: null,
      project: null,
    },
    fetchMock,
  )

  const chat = await client.generateJson({
    providerConfigId: "cfg_openai_default",
    instructions: "Return JSON",
    input: "Build a draft",
    model: "gpt-4.1-mini",
  })
  const embeddings = await client.embedText({
    providerConfigId: "cfg_openai_default",
    input: "embed me",
    model: "text-embedding-3-small",
  })

  assert.equal(chat.model, "gpt-4.1-mini")
  assert.match(chat.text, /draft_text/)
  assert.deepEqual(embeddings.vector, [0.1, 0.2, 0.3])
  assert.equal(requests[0]?.url.endsWith("/chat/completions"), true)
  assert.equal(requests[1]?.url.endsWith("/embeddings"), true)
})

test("GeminiClient calls generateContent and embedContent", async () => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = []
  const fetchMock: typeof fetch = async (input, init) => {
    const url = String(input)

    requests.push({ url, init })

    if (url.includes(":generateContent")) {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '{"assistant_message":"gemini-ready"}' }],
              },
            },
          ],
        }),
      )
    }

    return new Response(
      JSON.stringify({
        embedding: {
          values: [0.4, 0.5, 0.6],
        },
      }),
    )
  }

  const client = new GeminiClient(
    {
      id: "user_provider_gemini",
      label: "Gemini",
      provider: "gemini",
      apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: "gem-test",
      textModel: "gemini-2.5-flash",
      timeoutMs: 45000,
      organization: null,
      project: null,
    },
    fetchMock,
  )

  const chat = await client.generateJson({
    providerConfigId: "user_provider_gemini",
    instructions: "Return JSON",
    input: "Reply",
    model: "gemini-2.5-flash",
  })
  const embeddings = await client.embedText({
    providerConfigId: "user_provider_gemini",
    input: "embed me",
    model: "text-embedding-004",
    purpose: "document",
  })

  assert.equal(chat.model, "gemini-2.5-flash")
  assert.equal(chat.text, '{"assistant_message":"gemini-ready"}')
  assert.deepEqual(embeddings.vector, [0.4, 0.5, 0.6])
  assert.equal(requests[0]?.url.includes(":generateContent"), true)
  assert.equal(requests[1]?.url.includes(":embedContent"), true)
})

test("AnthropicClient calls the messages endpoint", async () => {
  const fetchMock: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        content: [
          {
            type: "text",
            text: '{"assistant_message":"anthropic-ready"}',
          },
        ],
      }),
    )

  const client = new AnthropicClient(
    {
      id: "user_provider_anthropic",
      label: "Anthropic",
      provider: "anthropic",
      apiBaseUrl: "https://api.anthropic.com",
      apiKey: "anthropic-test",
      textModel: "claude-sonnet",
      timeoutMs: 45000,
      organization: null,
      project: null,
    },
    fetchMock,
  )

  const chat = await client.generateJson({
    providerConfigId: "user_provider_anthropic",
    instructions: "Return JSON",
    input: "Reply",
    model: "claude-sonnet",
  })

  assert.equal(chat.model, "claude-sonnet")
  assert.equal(chat.text, '{"assistant_message":"anthropic-ready"}')
})
