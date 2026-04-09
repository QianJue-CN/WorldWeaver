"use client"

import {
  type AppLocale,
  getWorldWeaverWebCopy,
  type WorldWeaverWebCopy,
} from "@worldweaver/config"
import type {
  ChatSendResponse,
  CommitWorldResponse,
  CreateSessionResponse,
  DraftGenerateResponse,
  HealthResponse,
} from "@worldweaver/contracts"
import {
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"
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

const localizedDefaultsByLocale = {
  en: getWorldWeaverWebCopy("en").controlCenter.defaults,
  "zh-CN": getWorldWeaverWebCopy("zh-CN").controlCenter.defaults,
} as const

const defaultCandidates = {
  providerConfigId: [
    localizedDefaultsByLocale.en.providerConfigId,
    localizedDefaultsByLocale["zh-CN"].providerConfigId,
  ],
  basePrompt: [
    localizedDefaultsByLocale.en.basePrompt,
    localizedDefaultsByLocale["zh-CN"].basePrompt,
  ],
  refineFeedback: [
    localizedDefaultsByLocale.en.refineFeedback,
    localizedDefaultsByLocale["zh-CN"].refineFeedback,
  ],
  worldName: [
    localizedDefaultsByLocale.en.worldName,
    localizedDefaultsByLocale["zh-CN"].worldName,
  ],
  worldTheme: [
    localizedDefaultsByLocale.en.worldTheme,
    localizedDefaultsByLocale["zh-CN"].worldTheme,
  ],
  sessionTitle: [
    localizedDefaultsByLocale.en.sessionTitle,
    localizedDefaultsByLocale["zh-CN"].sessionTitle,
  ],
  sessionUserId: [
    localizedDefaultsByLocale.en.sessionUserId,
    localizedDefaultsByLocale["zh-CN"].sessionUserId,
  ],
  chatMessage: [
    localizedDefaultsByLocale.en.chatMessage,
    localizedDefaultsByLocale["zh-CN"].chatMessage,
  ],
} as const

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

function formatTemplate(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

function replaceSeedValue(
  currentValue: string,
  nextValue: string,
  candidates: readonly string[],
) {
  return candidates.includes(currentValue) ? nextValue : currentValue
}

function formatTime(locale: AppLocale, timestamp: number | null) {
  if (timestamp === null) {
    return null
  }

  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatServerStatus(
  status: string,
  labels: WorldWeaverWebCopy["controlCenter"]["serverStatusLabels"],
) {
  return labels[status as keyof typeof labels] ?? status
}

function ActionCard({
  eyebrow,
  title,
  copy,
  status,
  statusLabel,
  children,
  wide = false,
}: Readonly<{
  eyebrow: string
  title: string
  copy: string
  status: AsyncStatus
  statusLabel: string
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
        <span className={createStatusClassName(status)}>{statusLabel}</span>
      </div>
      <p className="action-copy">{copy}</p>
      {children}
    </article>
  )
}

export function WorldWeaverControlCenter({
  copy,
  locale,
}: Readonly<{
  copy: WorldWeaverWebCopy["controlCenter"]
  locale: AppLocale
}>) {
  const [providerConfigId, setProviderConfigId] = useState(
    copy.defaults.providerConfigId,
  )
  const [basePrompt, setBasePrompt] = useState(copy.defaults.basePrompt)
  const [enableSearch, setEnableSearch] = useState(true)
  const [refineFeedback, setRefineFeedback] = useState(
    copy.defaults.refineFeedback,
  )
  const [worldName, setWorldName] = useState(copy.defaults.worldName)
  const [worldTheme, setWorldTheme] = useState(copy.defaults.worldTheme)
  const [sessionTitle, setSessionTitle] = useState(copy.defaults.sessionTitle)
  const [sessionUserId, setSessionUserId] = useState(
    copy.defaults.sessionUserId,
  )
  const [chatMessage, setChatMessage] = useState(copy.defaults.chatMessage)

  const [healthState, setHealthState] = useState<ActionState<HealthResponse>>(
    createIdleState(copy.health.fallback.idle),
  )
  const [healthCheckedAt, setHealthCheckedAt] = useState<number | null>(null)

  const [draftState, setDraftState] = useState<
    ActionState<DraftGenerateResponse>
  >(createIdleState(copy.draft.fallback.idle))
  const [commitState, setCommitState] = useState<
    ActionState<CommitWorldResponse>
  >(createIdleState(copy.commit.fallback.idle))
  const [sessionState, setSessionState] = useState<
    ActionState<CreateSessionResponse>
  >(createIdleState(copy.session.fallback.idle))
  const [chatState, setChatState] = useState<ActionState<ChatSendResponse>>(
    createIdleState(copy.chat.fallback.idle),
  )
  const [chatLog, setChatLog] = useState<ChatEntry[]>([])
  const previousLocaleRef = useRef(locale)

  const activeDraft = draftState.data
  const activeWorldId =
    sessionState.data?.world_id ?? commitState.data?.world_id
  const activeSessionId = sessionState.data?.session_id

  useEffect(() => {
    const previousLocale = previousLocaleRef.current

    if (previousLocale === locale) {
      return
    }

    setProviderConfigId((current) =>
      replaceSeedValue(
        current,
        copy.defaults.providerConfigId,
        defaultCandidates.providerConfigId,
      ),
    )
    setBasePrompt((current) =>
      replaceSeedValue(
        current,
        copy.defaults.basePrompt,
        defaultCandidates.basePrompt,
      ),
    )
    setRefineFeedback((current) =>
      replaceSeedValue(
        current,
        copy.defaults.refineFeedback,
        defaultCandidates.refineFeedback,
      ),
    )
    setWorldName((current) =>
      replaceSeedValue(
        current,
        copy.defaults.worldName,
        defaultCandidates.worldName,
      ),
    )
    setWorldTheme((current) =>
      replaceSeedValue(
        current,
        copy.defaults.worldTheme,
        defaultCandidates.worldTheme,
      ),
    )
    setSessionTitle((current) =>
      replaceSeedValue(
        current,
        copy.defaults.sessionTitle,
        defaultCandidates.sessionTitle,
      ),
    )
    setSessionUserId((current) =>
      replaceSeedValue(
        current,
        copy.defaults.sessionUserId,
        defaultCandidates.sessionUserId,
      ),
    )
    setChatMessage((current) =>
      replaceSeedValue(
        current,
        copy.defaults.chatMessage,
        defaultCandidates.chatMessage,
      ),
    )

    setHealthState((current) =>
      current.status === "idle"
        ? createIdleState(copy.health.fallback.idle)
        : current,
    )
    setDraftState((current) =>
      current.status === "idle"
        ? createIdleState(copy.draft.fallback.idle)
        : current,
    )
    setCommitState((current) =>
      current.status === "idle"
        ? createIdleState(copy.commit.fallback.idle)
        : current,
    )
    setSessionState((current) =>
      current.status === "idle"
        ? createIdleState(copy.session.fallback.idle)
        : current,
    )
    setChatState((current) =>
      current.status === "idle"
        ? createIdleState(copy.chat.fallback.idle)
        : current,
    )

    previousLocaleRef.current = locale
  }, [copy, locale])

  const checkHealth = useEffectEvent(async () => {
    setHealthState({
      status: "loading",
      message: formatTemplate(copy.health.messages.checking, { apiBaseUrl }),
      data: null,
    })

    try {
      const response = await getHealth({ locale })

      setHealthState({
        status: "success",
        message: formatTemplate(copy.health.messages.success, {
          requestId: response.request_id,
        }),
        data: response.data,
      })
      setHealthCheckedAt(Date.now())
    } catch (error) {
      setHealthState({
        status: "error",
        message: getErrorMessage(error, locale),
        data: null,
      })
      setHealthCheckedAt(Date.now())
    }
  })

  useEffect(() => {
    void checkHealth()
  }, [])

  async function handleGenerateDraft() {
    setDraftState({
      status: "loading",
      message: copy.draft.messages.generating,
      data: activeDraft ?? null,
    })

    try {
      const response = await generateDraft(
        {
          base_prompt: basePrompt,
          enable_search: enableSearch,
          provider_config_id: providerConfigId,
        },
        { locale },
      )

      setDraftState({
        status: "success",
        message: formatTemplate(copy.draft.messages.success, {
          requestId: response.request_id,
        }),
        data: response.data,
      })
      setCommitState(createIdleState(copy.draft.messages.commitReady))
      setSessionState(createIdleState(copy.draft.messages.sessionLocked))
      setChatState(createIdleState(copy.draft.messages.chatLocked))
      setChatLog([])
    } catch (error) {
      setDraftState({
        status: "error",
        message: getErrorMessage(error, locale),
        data: activeDraft ?? null,
      })
    }
  }

  async function handleRefineDraft() {
    if (!activeDraft) {
      setDraftState({
        status: "error",
        message: copy.draft.messages.refineMissingDraft,
        data: null,
      })
      return
    }

    setDraftState({
      status: "loading",
      message: formatTemplate(copy.draft.messages.refining, {
        draftId: activeDraft.draft_id,
      }),
      data: activeDraft,
    })

    try {
      const response = await refineDraft(
        {
          draft_id: activeDraft.draft_id,
          user_feedback: refineFeedback,
          provider_config_id: providerConfigId,
        },
        { locale },
      )

      setDraftState({
        status: "success",
        message: formatTemplate(copy.draft.messages.success, {
          requestId: response.request_id,
        }),
        data: response.data,
      })
    } catch (error) {
      setDraftState({
        status: "error",
        message: getErrorMessage(error, locale),
        data: activeDraft,
      })
    }
  }

  async function handleCommitWorld() {
    if (!activeDraft) {
      setCommitState({
        status: "error",
        message: copy.commit.messages.missingDraft,
        data: null,
      })
      return
    }

    setCommitState({
      status: "loading",
      message: formatTemplate(copy.commit.messages.committing, {
        draftId: activeDraft.draft_id,
      }),
      data: commitState.data,
    })

    try {
      const response = await commitWorld(
        {
          draft_id: activeDraft.draft_id,
          world_name: worldName,
          theme: worldTheme,
        },
        { locale },
      )

      setCommitState({
        status: "success",
        message: formatTemplate(copy.commit.messages.success, {
          requestId: response.request_id,
        }),
        data: response.data,
      })
      setSessionState(createIdleState(copy.commit.messages.sessionReady))
      setChatState(createIdleState(copy.commit.messages.chatLocked))
      setChatLog([])
    } catch (error) {
      setCommitState({
        status: "error",
        message: getErrorMessage(error, locale),
        data: commitState.data,
      })
    }
  }

  async function handleCreateSession() {
    if (!activeWorldId) {
      setSessionState({
        status: "error",
        message: copy.session.messages.missingWorld,
        data: null,
      })
      return
    }

    setSessionState({
      status: "loading",
      message: formatTemplate(copy.session.messages.creating, {
        worldId: activeWorldId,
      }),
      data: sessionState.data,
    })

    try {
      const response = await createSession(
        {
          world_id: activeWorldId,
          user_id: sessionUserId,
          title: sessionTitle,
        },
        { locale },
      )

      setSessionState({
        status: "success",
        message: formatTemplate(copy.session.messages.success, {
          requestId: response.request_id,
        }),
        data: response.data,
      })
      setChatState({
        status: "idle",
        message: copy.session.messages.chatReady,
        data: null,
      })
      setChatLog([])
    } catch (error) {
      setSessionState({
        status: "error",
        message: getErrorMessage(error, locale),
        data: sessionState.data,
      })
    }
  }

  async function handleSendChat() {
    if (!activeSessionId) {
      setChatState({
        status: "error",
        message: copy.chat.messages.missingSession,
        data: null,
      })
      return
    }

    setChatState({
      status: "loading",
      message: formatTemplate(copy.chat.messages.sending, {
        sessionId: activeSessionId,
      }),
      data: chatState.data,
    })

    try {
      const response = await sendChat(
        {
          session_id: activeSessionId,
          user_message: chatMessage,
          provider_config_id: providerConfigId,
        },
        { locale },
      )

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
        message: formatTemplate(copy.chat.messages.success, {
          requestId: response.request_id,
        }),
        data: response.data,
      })
      setChatMessage("")
    } catch (error) {
      setChatState({
        status: "error",
        message: getErrorMessage(error, locale),
        data: chatState.data,
      })
    }
  }

  return (
    <div className="control-grid">
      <ActionCard
        copy={copy.health.copy}
        eyebrow={copy.health.eyebrow}
        status={healthState.status}
        statusLabel={copy.statusLabels[healthState.status]}
        title={copy.health.title}
        wide
      >
        <div className="signal-strip">
          <div className="signal-tile">
            <p className="result-title">{copy.health.labels.apiBaseUrl}</p>
            <p className="muted-copy mono-text">{apiBaseUrl}</p>
          </div>
          <div className="signal-tile">
            <p className="result-title">{copy.health.labels.service}</p>
            <p className="muted-copy">
              {healthState.data?.service ?? copy.health.fallback.service}
            </p>
          </div>
          <div className="signal-tile">
            <p className="result-title">{copy.health.labels.startedAt}</p>
            <p className="muted-copy mono-text">
              {healthState.data?.started_at ?? copy.health.fallback.startedAt}
            </p>
          </div>
          <div className="signal-tile">
            <p className="result-title">{copy.health.labels.lastCheck}</p>
            <p className="muted-copy">
              {formatTime(locale, healthCheckedAt) ??
                copy.health.fallback.lastCheck}
            </p>
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
            {copy.health.refreshButton}
          </button>
          <p className="helper-copy">{copy.health.helper}</p>
        </div>
      </ActionCard>

      <ActionCard
        copy={copy.draft.copy}
        eyebrow={copy.draft.eyebrow}
        status={draftState.status}
        statusLabel={copy.statusLabels[draftState.status]}
        title={copy.draft.title}
        wide
      >
        <fieldset disabled={draftState.status === "loading"}>
          <div className="field-grid field-grid-single">
            <label className="field" htmlFor="base-prompt">
              <span className="field-label">
                {copy.draft.labels.basePrompt}
              </span>
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
              <span className="field-label">
                {copy.draft.labels.providerConfigId}
              </span>
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
              <span>{copy.draft.labels.enableSearch}</span>
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
              {copy.draft.buttons.generate}
            </button>
            <button
              className="ghost-button"
              disabled={!activeDraft}
              onClick={() => {
                void handleRefineDraft()
              }}
              type="button"
            >
              {copy.draft.buttons.refine}
            </button>
          </div>

          <div className="field-grid field-grid-single">
            <label className="field" htmlFor="refine-feedback">
              <span className="field-label">
                {copy.draft.labels.refineFeedback}
              </span>
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
                <p className="result-title">{copy.draft.labels.draftId}</p>
                <p className="muted-copy mono-text">{activeDraft.draft_id}</p>
              </div>
              <div className="result-panel">
                <p className="result-title">{copy.draft.labels.draftStatus}</p>
                <p className="muted-copy">
                  {formatServerStatus(
                    activeDraft.status,
                    copy.serverStatusLabels,
                  )}
                </p>
              </div>
            </div>

            <div className="result-panel">
              <p className="result-title">{copy.draft.labels.outline}</p>
              <ul className="list-reset result-block">
                {activeDraft.outline.map((item) => (
                  <li className="muted-copy" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="result-panel">
              <p className="result-title">{copy.draft.labels.referenceNotes}</p>
              <div className="chip-list result-block">
                {activeDraft.reference_notes.map((item) => (
                  <span className="tag-pill tag-pill-soft" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="result-panel">
              <p className="result-title">{copy.draft.labels.draftText}</p>
              <p className="muted-copy result-pre">{activeDraft.draft_text}</p>
            </div>
          </div>
        ) : null}
      </ActionCard>

      <ActionCard
        copy={copy.commit.copy}
        eyebrow={copy.commit.eyebrow}
        status={commitState.status}
        statusLabel={copy.statusLabels[commitState.status]}
        title={copy.commit.title}
      >
        <fieldset disabled={commitState.status === "loading"}>
          <div className="field-grid">
            <label className="field" htmlFor="world-name">
              <span className="field-label">
                {copy.commit.labels.worldName}
              </span>
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
              <span className="field-label">{copy.commit.labels.theme}</span>
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
              {copy.commit.buttons.commit}
            </button>
            <p className="helper-copy">
              {copy.commit.labels.currentDraft}:{" "}
              <span className="mono-text">
                {activeDraft?.draft_id ?? copy.commit.fallback.currentDraft}
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
                <p className="result-title">{copy.commit.labels.worldId}</p>
                <p className="muted-copy mono-text">
                  {commitState.data.world_id}
                </p>
              </div>
              <div className="result-panel">
                <p className="result-title">
                  {copy.commit.labels.pipelineState}
                </p>
                <p className="muted-copy">
                  {formatServerStatus(
                    commitState.data.status,
                    copy.serverStatusLabels,
                  )}
                </p>
              </div>
            </div>

            <div className="result-panel">
              <p className="result-title">{copy.commit.labels.queuedJobs}</p>
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
        copy={copy.session.copy}
        eyebrow={copy.session.eyebrow}
        status={sessionState.status}
        statusLabel={copy.statusLabels[sessionState.status]}
        title={copy.session.title}
      >
        <fieldset disabled={sessionState.status === "loading"}>
          <div className="field-grid">
            <label className="field" htmlFor="session-user-id">
              <span className="field-label">{copy.session.labels.userId}</span>
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
              <span className="field-label">
                {copy.session.labels.sessionTitle}
              </span>
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
              {copy.session.buttons.create}
            </button>
            <p className="helper-copy">
              {copy.session.labels.activeWorld}:{" "}
              <span className="mono-text">
                {activeWorldId ?? copy.session.fallback.activeWorld}
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
                <p className="result-title">{copy.session.labels.sessionId}</p>
                <p className="muted-copy mono-text">
                  {sessionState.data.session_id}
                </p>
              </div>
              <div className="result-panel">
                <p className="result-title">
                  {copy.session.labels.sessionStatus}
                </p>
                <p className="muted-copy">
                  {formatServerStatus(
                    sessionState.data.status,
                    copy.serverStatusLabels,
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </ActionCard>

      <ActionCard
        copy={copy.chat.copy}
        eyebrow={copy.chat.eyebrow}
        status={chatState.status}
        statusLabel={copy.statusLabels[chatState.status]}
        title={copy.chat.title}
        wide
      >
        <fieldset disabled={chatState.status === "loading"}>
          <div className="field-grid field-grid-single">
            <label className="field" htmlFor="chat-message">
              <span className="field-label">{copy.chat.labels.playerMove}</span>
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
              {copy.chat.buttons.send}
            </button>
            <p className="helper-copy">
              {copy.chat.labels.activeSession}:{" "}
              <span className="mono-text">
                {activeSessionId ?? copy.chat.fallback.activeSession}
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
              <p className="result-title">{copy.chat.labels.queuedJobs}</p>
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
                <p className="chat-role">
                  {entry.role === "user"
                    ? copy.chat.roles.user
                    : copy.chat.roles.assistant}
                </p>
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
            <p className="result-title">
              {copy.chat.labels.conversationThread}
            </p>
            <p className="muted-copy result-block">
              {copy.chat.fallback.emptyThread}
            </p>
          </div>
        )}
      </ActionCard>
    </div>
  )
}
