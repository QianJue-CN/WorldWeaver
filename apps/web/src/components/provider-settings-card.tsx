"use client"

import type { AppLocale, WorldWeaverWebCopy } from "@worldweaver/config"
import type {
  ProviderConfigListResponse,
  SavedProviderConfig,
} from "@worldweaver/contracts"
import { useEffect, useEffectEvent, useState } from "react"
import {
  deleteProviderConfig,
  getErrorMessage,
  getProviderConfigs,
  saveProviderConfig,
} from "../lib/api"

type AsyncStatus = "idle" | "loading" | "success" | "error"
type ProviderFormat = "openai" | "gemini" | "anthropic"

type ActionState<T> = {
  status: AsyncStatus
  message: string
  data: T | null
}

type ProviderFormState = {
  providerConfigId: string | null
  label: string
  provider: ProviderFormat
  apiBaseUrl: string
  apiKey: string
  textModel: string
  embeddingModel: string
  isDefault: boolean
}

const providerFormatTemplates = {
  openai: {
    apiBaseUrl: "https://api.openai.com/v1",
    textModel: "gpt-4.1-mini",
    embeddingModel: "text-embedding-3-small",
  },
  gemini: {
    apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    textModel: "",
    embeddingModel: "",
  },
  anthropic: {
    apiBaseUrl: "https://api.anthropic.com",
    textModel: "",
    embeddingModel: "",
  },
} as const

function createIdleState<T>(message: string): ActionState<T> {
  return { status: "idle", message, data: null }
}

function createStatusClassName(status: AsyncStatus) {
  return `status-badge status-${status}`
}

function createFeedbackClassName(status: AsyncStatus) {
  if (status === "loading") return "feedback feedback-loading"
  if (status === "success") return "feedback feedback-success"
  if (status === "error") return "feedback feedback-error"
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

function createProviderFormState(
  format: ProviderFormat = "openai",
): ProviderFormState {
  return {
    providerConfigId: null,
    label: "",
    provider: format,
    apiBaseUrl: providerFormatTemplates[format].apiBaseUrl,
    apiKey: "",
    textModel: providerFormatTemplates[format].textModel,
    embeddingModel:
      format === "anthropic"
        ? ""
        : providerFormatTemplates[format].embeddingModel,
    isDefault: false,
  }
}

function formatCapabilities(item: SavedProviderConfig, fallback: string) {
  return item.capabilities.length > 0 ? item.capabilities.join(" / ") : fallback
}

export function ProviderSettingsCard({
  copy,
  locale,
  sessionUserId,
  providerConfigId,
  statusLabels,
  onSessionUserIdChange,
  onProviderConfigChange,
}: Readonly<{
  copy: WorldWeaverWebCopy["controlCenter"]["providers"]
  locale: AppLocale
  sessionUserId: string
  providerConfigId: string
  statusLabels: WorldWeaverWebCopy["controlCenter"]["statusLabels"]
  onSessionUserIdChange: (nextValue: string) => void
  onProviderConfigChange: (nextValue: string) => void
}>) {
  const [providerState, setProviderState] = useState<
    ActionState<ProviderConfigListResponse>
  >(createIdleState(copy.fallback.idle))
  const [providerForm, setProviderForm] = useState<ProviderFormState>(() =>
    createProviderFormState(),
  )

  const providerItems = providerState.data?.items ?? []
  const activeProviderId =
    providerState.data?.active_provider_config_id ??
    copy.fallback.activeProvider

  const applyProviderList = useEffectEvent(
    (
      nextData: ProviderConfigListResponse,
      message: string,
      status: AsyncStatus = "success",
    ) => {
      setProviderState({
        status,
        message,
        data: nextData,
      })

      if (
        !nextData.items.some(
          (item) => item.provider_config_id === providerConfigId,
        ) &&
        nextData.active_provider_config_id
      ) {
        onProviderConfigChange(nextData.active_provider_config_id)
      }
    },
  )

  const loadProviders = useEffectEvent(async (messageOverride?: string) => {
    setProviderState((current) => ({
      status: "loading",
      message: copy.messages.loading,
      data: current.data,
    }))

    try {
      const response = await getProviderConfigs(sessionUserId, { locale })

      applyProviderList(
        response.data,
        messageOverride ??
          `${copy.labels.activeProvider}: ${
            response.data.active_provider_config_id ??
            copy.fallback.activeProvider
          }`,
      )
    } catch (error) {
      setProviderState((current) => ({
        status: "error",
        message: getErrorMessage(error, locale),
        data: current.data,
      }))
    }
  })

  useEffect(() => {
    void loadProviders()
  }, [])

  async function handleSaveProvider() {
    setProviderState((current) => ({
      status: "loading",
      message: copy.messages.loading,
      data: current.data,
    }))

    try {
      const response = await saveProviderConfig(
        {
          ...(providerForm.providerConfigId
            ? { provider_config_id: providerForm.providerConfigId }
            : {}),
          owner_id: sessionUserId,
          label: providerForm.label,
          provider: providerForm.provider,
          api_base_url: providerForm.apiBaseUrl,
          ...(providerForm.apiKey.trim()
            ? { api_key: providerForm.apiKey.trim() }
            : {}),
          text_model: providerForm.textModel,
          embedding_model:
            providerForm.provider === "anthropic"
              ? null
              : providerForm.embeddingModel.trim() || null,
          is_default: providerForm.isDefault,
        },
        { locale },
      )

      setProviderForm(createProviderFormState(providerForm.provider))
      onProviderConfigChange(response.data.provider_config_id)
      await loadProviders(
        formatTemplate(copy.messages.saved, {
          requestId: response.request_id,
        }),
      )
    } catch (error) {
      setProviderState((current) => ({
        status: "error",
        message: getErrorMessage(error, locale),
        data: current.data,
      }))
    }
  }

  async function handleDeleteProvider(provider: SavedProviderConfig) {
    setProviderState((current) => ({
      status: "loading",
      message: copy.messages.loading,
      data: current.data,
    }))

    try {
      const response = await deleteProviderConfig(
        provider.provider_config_id,
        sessionUserId,
        { locale },
      )

      if (providerForm.providerConfigId === provider.provider_config_id) {
        setProviderForm(createProviderFormState())
      }

      await loadProviders(
        formatTemplate(copy.messages.deleted, {
          requestId: response.request_id,
        }),
      )
    } catch (error) {
      setProviderState((current) => ({
        status: "error",
        message: getErrorMessage(error, locale),
        data: current.data,
      }))
    }
  }

  return (
    <article className="action-card action-card-wide">
      <div className="action-header">
        <div>
          <p className="action-eyebrow">{copy.eyebrow}</p>
          <h3 className="action-title">{copy.title}</h3>
        </div>
        <span className={createStatusClassName(providerState.status)}>
          {statusLabels[providerState.status]}
        </span>
      </div>
      <p className="action-copy">{copy.copy}</p>

      <div className="signal-strip">
        <div className="signal-tile">
          <p className="result-title">{copy.labels.settingsOwner}</p>
          <p className="muted-copy mono-text">{sessionUserId}</p>
        </div>
        <div className="signal-tile">
          <p className="result-title">{copy.labels.activeProvider}</p>
          <p className="muted-copy mono-text">{activeProviderId}</p>
        </div>
        <div className="signal-tile">
          <p className="result-title">{copy.labels.status}</p>
          <p className="muted-copy">
            {providerItems.length > 0
              ? providerItems.length.toString()
              : statusLabels[providerState.status]}
          </p>
        </div>
        <div className="signal-tile">
          <p className="result-title">{copy.labels.capabilities}</p>
          <p className="muted-copy">
            {providerItems[0]
              ? formatCapabilities(
                  providerItems[0],
                  copy.fallback.embeddingUnavailable,
                )
              : copy.fallback.embeddingUnavailable}
          </p>
        </div>
      </div>

      <div
        className={createFeedbackClassName(providerState.status)}
        aria-live="polite"
      >
        {providerState.message}
      </div>

      <div className="button-row">
        <button
          className="ghost-button"
          onClick={() => {
            void loadProviders()
          }}
          type="button"
        >
          {copy.buttons.refresh}
        </button>
      </div>

      {providerItems.length > 0 ? (
        <div className="result-grid">
          {providerItems.map((item) => (
            <div className="result-panel" key={item.provider_config_id}>
              <div className="action-header">
                <div>
                  <p className="result-title">{item.label}</p>
                  <p className="muted-copy mono-text">
                    {item.provider_config_id}
                  </p>
                </div>
                <span className="tag-pill tag-pill-soft">{item.provider}</span>
              </div>
              <div className="result-block">
                <p className="muted-copy">
                  {copy.labels.capabilities}:{" "}
                  {formatCapabilities(item, copy.fallback.embeddingUnavailable)}
                </p>
                <p className="muted-copy">
                  {copy.labels.status}: {item.status}
                </p>
                <p className="muted-copy mono-text">{item.api_base_url}</p>
                <p className="muted-copy">
                  {copy.labels.textModel}: {item.text_model}
                </p>
                <p className="muted-copy">
                  {copy.labels.embeddingModel}:{" "}
                  {item.embedding_model ?? copy.fallback.embeddingUnavailable}
                </p>
                {item.api_key_preview ? (
                  <p className="muted-copy mono-text">
                    {copy.labels.apiKey}: {item.api_key_preview}
                  </p>
                ) : null}
              </div>
              <div className="button-row">
                <button
                  className="ghost-button"
                  onClick={() => {
                    onProviderConfigChange(item.provider_config_id)
                  }}
                  type="button"
                >
                  {copy.buttons.use}
                </button>
                {item.source === "user" ? (
                  <button
                    className="ghost-button"
                    onClick={() => {
                      setProviderForm({
                        providerConfigId: item.provider_config_id,
                        label: item.label,
                        provider: item.provider as ProviderFormat,
                        apiBaseUrl: item.api_base_url,
                        apiKey: "",
                        textModel: item.text_model,
                        embeddingModel: item.embedding_model ?? "",
                        isDefault: item.is_default,
                      })
                    }}
                    type="button"
                  >
                    {copy.buttons.edit}
                  </button>
                ) : null}
                {item.source === "user" ? (
                  <button
                    className="ghost-button"
                    onClick={() => {
                      void handleDeleteProvider(item)
                    }}
                    type="button"
                  >
                    {copy.buttons.delete}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="result-panel">
          <p className="muted-copy">{copy.fallback.emptyList}</p>
        </div>
      )}

      <fieldset disabled={providerState.status === "loading"}>
        <div className="field-grid">
          <label className="field" htmlFor="provider-owner">
            <span className="field-label">{copy.labels.settingsOwner}</span>
            <input
              className="field-input"
              id="provider-owner"
              onChange={(event) => {
                onSessionUserIdChange(event.target.value)
              }}
              required
              type="text"
              value={sessionUserId}
            />
          </label>

          <label className="field" htmlFor="provider-label">
            <span className="field-label">{copy.labels.providerLabel}</span>
            <input
              className="field-input"
              id="provider-label"
              onChange={(event) => {
                setProviderForm((current) => ({
                  ...current,
                  label: event.target.value,
                }))
              }}
              required
              type="text"
              value={providerForm.label}
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field" htmlFor="provider-format">
            <span className="field-label">{copy.labels.providerFormat}</span>
            <select
              className="field-input"
              id="provider-format"
              onChange={(event) => {
                const nextFormat = event.target.value as ProviderFormat

                setProviderForm((current) => ({
                  ...current,
                  provider: nextFormat,
                  apiBaseUrl: providerFormatTemplates[nextFormat].apiBaseUrl,
                  textModel:
                    current.provider === nextFormat && current.textModel
                      ? current.textModel
                      : providerFormatTemplates[nextFormat].textModel,
                  embeddingModel:
                    nextFormat === "anthropic"
                      ? ""
                      : current.provider === nextFormat &&
                          current.embeddingModel
                        ? current.embeddingModel
                        : providerFormatTemplates[nextFormat].embeddingModel,
                }))
              }}
              value={providerForm.provider}
            >
              <option value="openai">{copy.formatOptions.openai}</option>
              <option value="gemini">{copy.formatOptions.gemini}</option>
              <option value="anthropic">{copy.formatOptions.anthropic}</option>
            </select>
          </label>

          <label className="field" htmlFor="provider-active">
            <span className="field-label">{copy.labels.activeProvider}</span>
            <input
              className="field-input"
              id="provider-active"
              onChange={(event) => {
                onProviderConfigChange(event.target.value)
              }}
              required
              type="text"
              value={providerConfigId}
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field" htmlFor="provider-base-url">
            <span className="field-label">{copy.labels.apiBaseUrl}</span>
            <input
              className="field-input"
              id="provider-base-url"
              onChange={(event) => {
                setProviderForm((current) => ({
                  ...current,
                  apiBaseUrl: event.target.value,
                }))
              }}
              required
              type="text"
              value={providerForm.apiBaseUrl}
            />
          </label>

          <label className="field" htmlFor="provider-api-key">
            <span className="field-label">{copy.labels.apiKey}</span>
            <input
              className="field-input"
              id="provider-api-key"
              onChange={(event) => {
                setProviderForm((current) => ({
                  ...current,
                  apiKey: event.target.value,
                }))
              }}
              required={providerForm.providerConfigId === null}
              type="password"
              value={providerForm.apiKey}
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field" htmlFor="provider-text-model">
            <span className="field-label">{copy.labels.textModel}</span>
            <input
              className="field-input"
              id="provider-text-model"
              onChange={(event) => {
                setProviderForm((current) => ({
                  ...current,
                  textModel: event.target.value,
                }))
              }}
              required
              type="text"
              value={providerForm.textModel}
            />
          </label>

          <label className="field" htmlFor="provider-embedding-model">
            <span className="field-label">{copy.labels.embeddingModel}</span>
            <input
              className="field-input"
              disabled={providerForm.provider === "anthropic"}
              id="provider-embedding-model"
              onChange={(event) => {
                setProviderForm((current) => ({
                  ...current,
                  embeddingModel: event.target.value,
                }))
              }}
              type="text"
              value={
                providerForm.provider === "anthropic"
                  ? copy.fallback.embeddingUnavailable
                  : providerForm.embeddingModel
              }
            />
          </label>
        </div>

        <div className="button-row">
          <label className="field checkbox-field" htmlFor="provider-default">
            <input
              checked={providerForm.isDefault}
              id="provider-default"
              onChange={(event) => {
                setProviderForm((current) => ({
                  ...current,
                  isDefault: event.target.checked,
                }))
              }}
              type="checkbox"
            />
            <span>{copy.labels.setAsDefault}</span>
          </label>
        </div>

        <div className="button-row">
          <button
            className="button"
            onClick={() => {
              void handleSaveProvider()
            }}
            type="button"
          >
            {copy.buttons.save}
          </button>
          <button
            className="ghost-button"
            onClick={() => {
              setProviderForm(createProviderFormState())
            }}
            type="button"
          >
            {copy.buttons.clear}
          </button>
        </div>
      </fieldset>
    </article>
  )
}
