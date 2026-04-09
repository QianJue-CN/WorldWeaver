"use client"

import type {
  ChatSendResponse,
  CommitWorldResponse,
  CreateSessionResponse,
  DraftGenerateResponse,
  HealthResponse,
} from "@worldweaver/contracts"
import { type ReactNode, useEffect, useEffectEvent, useState } from "react"
import {
  apiBaseUrl,
  commitWorld,
  createSession,
  generateDraft,
  getErrorMessage,
  getHealth,
  refineDraft,
  sendChat,
} from "../lib/api"
import { PretextStreamText } from "./pretext-stream-text"

type AsyncStatus = "idle" | "loading" | "success" | "error"

type ActionState<T> = {
  status: AsyncStatus
  message: string
  data: T | null
}

type ChatEntry = {
  id: string
  role: "user" | "assistant"
  content: string
}

const initialWorldPrompt =
  "Build a rain-soaked gothic megacity where vampire houses control trade routes, debt, and ancient weather engines."
const initialRefinePrompt =
  "Push the ruling vampire house toward more cyber-gothic aesthetics and add one fragile alliance with machine monks."
const initialWorldName = "Ash Meridian"
const initialWorldTheme =
  "Cyber-gothic intrigue with industrial occult politics"
const initialSessionTitle = "Archive Break-In"
const initialUserId = "player_local"
const initialChatMessage =
  "I want to sneak into the Ash Meridian archive without waking the wardens. What do I notice first?"

function createIdleState<T>(message: string): ActionState<T> {
  return {
    status: "idle",
    message,
    data: null,
  }
}

function createStatusClassName(status: AsyncStatus) {
  return `status-badge status-${status}`
}

function createFeedbackClassName(status: AsyncStatus) {
  if (status === "loading") {
    return "feedback feedback-loading"
  }

  if (status === "success") {
    return "feedback feedback-success"
  }

  if (status === "error") {
    return "feedback feedback-error"
  }

  return "feedback"
}

function ActionCard({
  eyebrow,
  title,
  copy,
  status,
  children,
  wide = false,
}: Readonly<{
  eyebrow: string
  title: string
  copy: string
  status: AsyncStatus
  children: ReactNode
  wide?: boolean
}>) {
  return (
    <article className={`action-card${wide ? " action-card-wide" : ""}`}>
      <div className="action-header">
        <div>
          <p className="action-eyebrow">{eyebrow}</p>
          <h3 className="action-title">{title}</h3>
        </div>
        <span className={createStatusClassName(status)}>{status}</span>
      </div>
      <p className="action-copy">{copy}</p>
      {children}
    </article>
  )
}

export function WorldWeaverControlCenter() {
  const [providerConfigId, setProviderConfigId] = useState("cfg_openai_default")
  const [basePrompt, setBasePrompt] = useState(initialWorldPrompt)
  const [enableSearch, setEnableSearch] = useState(true)
  const [refineFeedback, setRefineFeedback] = useState(initialRefinePrompt)
  const [worldName, setWorldName] = useState(initialWorldName)
  const [worldTheme, setWorldTheme] = useState(initialWorldTheme)
  const [sessionTitle, setSessionTitle] = useState(initialSessionTitle)
  const [sessionUserId, setSessionUserId] = useState(initialUserId)
  const [chatMessage, setChatMessage] = useState(initialChatMessage)

  const [healthState, setHealthState] = useState<ActionState<HealthResponse>>(
    createIdleState("Run a health check to verify the local API target."),
  )
  const [healthCheckedAt, setHealthCheckedAt] = useState<string | null>(null)

  const [draftState, setDraftState] = useState<
    ActionState<DraftGenerateResponse>
  >(createIdleState("Generate a draft to unlock refinement and commit."))
  const [commitState, setCommitState] = useState<
    ActionState<CommitWorldResponse>
  >(createIdleState("Commit remains locked until a draft exists."))
  const [sessionState, setSessionState] = useState<
    ActionState<CreateSessionResponse>
  >(createIdleState("Create a session after the world commit is queued."))
  const [chatState, setChatState] = useState<ActionState<ChatSendResponse>>(
    createIdleState("Send a message after a session becomes active."),
  )
  const [chatLog, setChatLog] = useState<ChatEntry[]>([])

  const activeDraft = draftState.data
  const activeWorldId =
    sessionState.data?.world_id ?? commitState.data?.world_id
  const activeSessionId = sessionState.data?.session_id

  const checkHealth = useEffectEvent(async () => {
    setHealthState({
      status: "loading",
      message: `Checking ${apiBaseUrl}...`,
      data: null,
    })

    try {
      const response = await getHealth()

      setHealthState({
        status: "success",
        message: `API ready. Request ${response.request_id}.`,
        data: response.data,
      })
      setHealthCheckedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      )
    } catch (error) {
      setHealthState({
        status: "error",
        message: getErrorMessage(error),
        data: null,
      })
      setHealthCheckedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      )
    }
  })

  useEffect(() => {
    void checkHealth()
  }, [])

  async function handleGenerateDraft() {
    setDraftState({
      status: "loading",
      message: "Generating the first local world draft...",
      data: activeDraft ?? null,
    })

    try {
      const response = await generateDraft({
        base_prompt: basePrompt,
        enable_search: enableSearch,
        provider_config_id: providerConfigId,
      })

      setDraftState({
        status: "success",
        message: `Draft ready. Request ${response.request_id}.`,
        data: response.data,
      })
      setCommitState(createIdleState("Draft is ready. Commit can run next."))
      setSessionState(
        createIdleState("Create a session after the world commit is queued."),
      )
      setChatState(
        createIdleState("Send a message after a session becomes active."),
      )
      setChatLog([])
    } catch (error) {
      setDraftState({
        status: "error",
        message: getErrorMessage(error),
        data: activeDraft ?? null,
      })
    }
  }

  async function handleRefineDraft() {
    if (!activeDraft) {
      setDraftState({
        status: "error",
        message: "Generate a draft before asking for a refinement pass.",
        data: null,
      })
      return
    }

    setDraftState({
      status: "loading",
      message: `Refining ${activeDraft.draft_id}...`,
      data: activeDraft,
    })

    try {
      const response = await refineDraft({
        draft_id: activeDraft.draft_id,
        user_feedback: refineFeedback,
        provider_config_id: providerConfigId,
      })

      setDraftState({
        status: "success",
        message: `Refinement ready. Request ${response.request_id}.`,
        data: response.data,
      })
    } catch (error) {
      setDraftState({
        status: "error",
        message: getErrorMessage(error),
        data: activeDraft,
      })
    }
  }

  async function handleCommitWorld() {
    if (!activeDraft) {
      setCommitState({
        status: "error",
        message: "Commit needs the current draft id first.",
        data: null,
      })
      return
    }

    setCommitState({
      status: "loading",
      message: `Committing ${activeDraft.draft_id} into the processing pipeline...`,
      data: commitState.data,
    })

    try {
      const response = await commitWorld({
        draft_id: activeDraft.draft_id,
        world_name: worldName,
        theme: worldTheme,
      })

      setCommitState({
        status: "success",
        message: `World queued. Request ${response.request_id}.`,
        data: response.data,
      })
      setSessionState(
        createIdleState(
          "World processing is queued. Launch the first session.",
        ),
      )
      setChatState(
        createIdleState("Send a message after a session becomes active."),
      )
      setChatLog([])
    } catch (error) {
      setCommitState({
        status: "error",
        message: getErrorMessage(error),
        data: commitState.data,
      })
    }
  }

  async function handleCreateSession() {
    if (!activeWorldId) {
      setSessionState({
        status: "error",
        message:
          "Commit the world first so the session knows which world to use.",
        data: null,
      })
      return
    }

    setSessionState({
      status: "loading",
      message: `Creating a session under ${activeWorldId}...`,
      data: sessionState.data,
    })

    try {
      const response = await createSession({
        world_id: activeWorldId,
        user_id: sessionUserId,
        title: sessionTitle,
      })

      setSessionState({
        status: "success",
        message: `Session active. Request ${response.request_id}.`,
        data: response.data,
      })
      setChatState({
        status: "idle",
        message:
          "Session is live. Send the opening move to test the placeholder reply.",
        data: null,
      })
      setChatLog([])
    } catch (error) {
      setSessionState({
        status: "error",
        message: getErrorMessage(error),
        data: sessionState.data,
      })
    }
  }

  async function handleSendChat() {
    if (!activeSessionId) {
      setChatState({
        status: "error",
        message: "Create a session before sending chat.",
        data: null,
      })
      return
    }

    setChatState({
      status: "loading",
      message: `Sending the current turn to ${activeSessionId}...`,
      data: chatState.data,
    })

    try {
      const response = await sendChat({
        session_id: activeSessionId,
        user_message: chatMessage,
        provider_config_id: providerConfigId,
      })

      setChatLog((current) => [
        ...current,
        {
          id: `user-${current.length + 1}`,
          role: "user",
          content: chatMessage,
        },
        {
          id: `assistant-${current.length + 2}`,
          role: "assistant",
          content: response.data.assistant_message,
        },
      ])
      setChatState({
        status: "success",
        message: `Reply received. Request ${response.request_id}.`,
        data: response.data,
      })
      setChatMessage("")
    } catch (error) {
      setChatState({
        status: "error",
        message: getErrorMessage(error),
        data: chatState.data,
      })
    }
  }

  return (
    <div className="control-grid">
      <ActionCard
        copy="The page reads NEXT_PUBLIC_API_BASE_URL and checks the current Fastify target before deeper actions."
        eyebrow="Runtime Link"
        status={healthState.status}
        title="API handshake"
        wide
      >
        <div className="signal-strip">
          <div className="signal-tile">
            <p className="result-title">API base URL</p>
            <p className="muted-copy mono-text">{apiBaseUrl}</p>
          </div>
          <div className="signal-tile">
            <p className="result-title">Service</p>
            <p className="muted-copy">
              {healthState.data?.service ?? "Awaiting check"}
            </p>
          </div>
          <div className="signal-tile">
            <p className="result-title">Started at</p>
            <p className="muted-copy mono-text">
              {healthState.data?.started_at ?? "Not available yet"}
            </p>
          </div>
          <div className="signal-tile">
            <p className="result-title">Last check</p>
            <p className="muted-copy">{healthCheckedAt ?? "Checking..."}</p>
          </div>
        </div>

        <div
          className={createFeedbackClassName(healthState.status)}
          aria-live="polite"
        >
          {healthState.message}
        </div>

        <div className="button-row">
          <button
            className="ghost-button"
            onClick={() => {
              void checkHealth()
            }}
            type="button"
          >
            Refresh health
          </button>
          <p className="helper-copy">
            If this card stays red, start `pnpm dev:api` and confirm the local
            URL in `.env.local`.
          </p>
        </div>
      </ActionCard>

      <ActionCard
        copy="Generate the first setting pass, then request a refinement without leaving the page."
        eyebrow="Chapter 1"
        status={draftState.status}
        title="World draft studio"
        wide
      >
        <fieldset disabled={draftState.status === "loading"}>
          <div className="field-grid field-grid-single">
            <label className="field" htmlFor="base-prompt">
              <span className="field-label">Base prompt</span>
              <textarea
                className="field-textarea"
                id="base-prompt"
                onChange={(event) => {
                  setBasePrompt(event.target.value)
                }}
                required
                value={basePrompt}
              />
            </label>
          </div>

          <div className="field-grid">
            <label className="field" htmlFor="provider-config-id">
              <span className="field-label">Provider config id</span>
              <input
                className="field-input"
                id="provider-config-id"
                onChange={(event) => {
                  setProviderConfigId(event.target.value)
                }}
                required
                type="text"
                value={providerConfigId}
              />
            </label>

            <label className="field checkbox-field" htmlFor="enable-search">
              <input
                checked={enableSearch}
                id="enable-search"
                onChange={(event) => {
                  setEnableSearch(event.target.checked)
                }}
                type="checkbox"
              />
              <span>Enable search notes for the scaffold response</span>
            </label>
          </div>

          <div className="button-row">
            <button
              className="button"
              onClick={() => {
                void handleGenerateDraft()
              }}
              type="button"
            >
              Generate draft
            </button>
            <button
              className="ghost-button"
              disabled={!activeDraft}
              onClick={() => {
                void handleRefineDraft()
              }}
              type="button"
            >
              Refine current draft
            </button>
          </div>

          <div className="field-grid field-grid-single">
            <label className="field" htmlFor="refine-feedback">
              <span className="field-label">Refinement feedback</span>
              <textarea
                className="field-textarea"
                id="refine-feedback"
                onChange={(event) => {
                  setRefineFeedback(event.target.value)
                }}
                required
                value={refineFeedback}
              />
            </label>
          </div>
        </fieldset>

        <div
          className={createFeedbackClassName(draftState.status)}
          aria-live="polite"
        >
          {draftState.message}
        </div>

        {activeDraft ? (
          <div className="result-stack">
            <div className="result-grid">
              <div className="result-panel">
                <p className="result-title">Draft id</p>
                <p className="muted-copy mono-text">{activeDraft.draft_id}</p>
              </div>
              <div className="result-panel">
                <p className="result-title">Draft status</p>
                <p className="muted-copy">{activeDraft.status}</p>
              </div>
            </div>

            <div className="result-panel">
              <p className="result-title">Outline</p>
              <ul className="list-reset result-block">
                {activeDraft.outline.map((item) => (
                  <li className="muted-copy" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="result-panel">
              <p className="result-title">Reference notes</p>
              <div className="chip-list result-block">
                {activeDraft.reference_notes.map((item) => (
                  <span className="tag-pill tag-pill-soft" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="result-panel">
              <p className="result-title">Draft text</p>
              <p className="muted-copy result-pre">{activeDraft.draft_text}</p>
            </div>
          </div>
        ) : null}
      </ActionCard>

      <ActionCard
        copy="Move from draft mode into the processing pipeline and keep the returned job ids visible."
        eyebrow="Chapter 2"
        status={commitState.status}
        title="Commit the world"
      >
        <fieldset disabled={commitState.status === "loading"}>
          <div className="field-grid">
            <label className="field" htmlFor="world-name">
              <span className="field-label">World name</span>
              <input
                className="field-input"
                id="world-name"
                onChange={(event) => {
                  setWorldName(event.target.value)
                }}
                required
                type="text"
                value={worldName}
              />
            </label>

            <label className="field" htmlFor="world-theme">
              <span className="field-label">Theme</span>
              <input
                className="field-input"
                id="world-theme"
                onChange={(event) => {
                  setWorldTheme(event.target.value)
                }}
                required
                type="text"
                value={worldTheme}
              />
            </label>
          </div>

          <div className="button-row">
            <button
              className="button"
              disabled={!activeDraft}
              onClick={() => {
                void handleCommitWorld()
              }}
              type="button"
            >
              Commit world
            </button>
            <p className="helper-copy">
              Current draft:{" "}
              <span className="mono-text">
                {activeDraft?.draft_id ?? "Generate draft first"}
              </span>
            </p>
          </div>
        </fieldset>

        <div
          className={createFeedbackClassName(commitState.status)}
          aria-live="polite"
        >
          {commitState.message}
        </div>

        {commitState.data ? (
          <div className="result-stack">
            <div className="result-grid">
              <div className="result-panel">
                <p className="result-title">World id</p>
                <p className="muted-copy mono-text">
                  {commitState.data.world_id}
                </p>
              </div>
              <div className="result-panel">
                <p className="result-title">Pipeline state</p>
                <p className="muted-copy">{commitState.data.status}</p>
              </div>
            </div>

            <div className="result-panel">
              <p className="result-title">Queued jobs</p>
              <div className="chip-list result-block">
                {commitState.data.queued_jobs.map((item) => (
                  <span className="tag-pill tag-pill-soft" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </ActionCard>

      <ActionCard
        copy="Spin up a player session against the committed world so the chat loop can attach to a concrete session id."
        eyebrow="Chapter 3"
        status={sessionState.status}
        title="Launch a session"
      >
        <fieldset disabled={sessionState.status === "loading"}>
          <div className="field-grid">
            <label className="field" htmlFor="session-user-id">
              <span className="field-label">User id</span>
              <input
                className="field-input"
                id="session-user-id"
                onChange={(event) => {
                  setSessionUserId(event.target.value)
                }}
                required
                type="text"
                value={sessionUserId}
              />
            </label>

            <label className="field" htmlFor="session-title">
              <span className="field-label">Session title</span>
              <input
                className="field-input"
                id="session-title"
                onChange={(event) => {
                  setSessionTitle(event.target.value)
                }}
                required
                type="text"
                value={sessionTitle}
              />
            </label>
          </div>

          <div className="button-row">
            <button
              className="button"
              disabled={!activeWorldId}
              onClick={() => {
                void handleCreateSession()
              }}
              type="button"
            >
              Create session
            </button>
            <p className="helper-copy">
              Active world:{" "}
              <span className="mono-text">
                {activeWorldId ?? "Commit world first"}
              </span>
            </p>
          </div>
        </fieldset>

        <div
          className={createFeedbackClassName(sessionState.status)}
          aria-live="polite"
        >
          {sessionState.message}
        </div>

        {sessionState.data ? (
          <div className="result-stack">
            <div className="result-grid">
              <div className="result-panel">
                <p className="result-title">Session id</p>
                <p className="muted-copy mono-text">
                  {sessionState.data.session_id}
                </p>
              </div>
              <div className="result-panel">
                <p className="result-title">Session status</p>
                <p className="muted-copy">{sessionState.data.status}</p>
              </div>
            </div>
          </div>
        ) : null}
      </ActionCard>

      <ActionCard
        copy="Send a player move into the placeholder chat route and render the assistant reply with pretext-based line layout."
        eyebrow="Chapter 4"
        status={chatState.status}
        title="Story terminal"
        wide
      >
        <fieldset disabled={chatState.status === "loading"}>
          <div className="field-grid field-grid-single">
            <label className="field" htmlFor="chat-message">
              <span className="field-label">Player move</span>
              <textarea
                className="field-textarea"
                id="chat-message"
                onChange={(event) => {
                  setChatMessage(event.target.value)
                }}
                required
                value={chatMessage}
              />
            </label>
          </div>

          <div className="button-row">
            <button
              className="button"
              disabled={!activeSessionId}
              onClick={() => {
                void handleSendChat()
              }}
              type="button"
            >
              Send opening turn
            </button>
            <p className="helper-copy">
              Active session:{" "}
              <span className="mono-text">
                {activeSessionId ?? "Create session first"}
              </span>
            </p>
          </div>
        </fieldset>

        <div
          className={createFeedbackClassName(chatState.status)}
          aria-live="polite"
        >
          {chatState.message}
        </div>

        {chatState.data ? (
          <div className="result-stack">
            <div className="result-panel">
              <p className="result-title">Queued jobs</p>
              <div className="chip-list result-block">
                {chatState.data.queued_jobs.map((item) => (
                  <span className="tag-pill tag-pill-soft" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {chatLog.length > 0 ? (
          <div className="chat-thread">
            {chatLog.map((entry) => (
              <article
                className={`chat-bubble ${
                  entry.role === "user"
                    ? "chat-bubble-user"
                    : "chat-bubble-assistant"
                }`}
                key={entry.id}
              >
                <p className="chat-role">{entry.role}</p>
                {entry.role === "assistant" ? (
                  <PretextStreamText text={entry.content} />
                ) : (
                  <p className="chat-text">{entry.content}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="result-panel">
            <p className="result-title">Conversation thread</p>
            <p className="muted-copy result-block">
              No turns yet. Launch the first message after the session is
              active.
            </p>
          </div>
        )}
      </ActionCard>
    </div>
  )
}
