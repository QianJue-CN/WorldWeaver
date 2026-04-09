"use client"

import {
  type AppLocale,
  defaultLocale,
  getApiRouteCatalog,
  getBootstrapSummary,
  getWorkerJobCatalog,
  getWorldWeaverWebCopy,
  localeCatalog,
  localeStorageKey,
  resolveLocale,
} from "@worldweaver/config"
import {
  type BootstrapCatalogResponse,
  bootstrapCatalogResponseSchema,
} from "@worldweaver/contracts"
import { startTransition, useEffect, useEffectEvent, useState } from "react"
import { getBootstrapCatalog, getErrorMessage } from "../lib/api"
import { WorldWeaverControlCenter } from "./worldweaver-control-center"

type BootstrapSyncStatus = "loading" | "success" | "error"

function createFallbackBootstrapCatalog(
  locale: AppLocale,
): BootstrapCatalogResponse {
  const bootstrapSummary = getBootstrapSummary(locale)

  return bootstrapCatalogResponseSchema.parse({
    ...bootstrapSummary,
    api_routes: getApiRouteCatalog(locale),
    worker_jobs: getWorkerJobCatalog(locale),
  })
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

export function WorldWeaverHome() {
  const [locale, setLocale] = useState<AppLocale>(defaultLocale)
  const [bootstrapCatalog, setBootstrapCatalog] =
    useState<BootstrapCatalogResponse>(() =>
      createFallbackBootstrapCatalog(defaultLocale),
    )
  const [bootstrapSyncState, setBootstrapSyncState] = useState<{
    status: BootstrapSyncStatus
    message: string
  }>(() => ({
    status: "loading",
    message: getWorldWeaverWebCopy(defaultLocale).bootstrapSync.loading,
  }))

  const applyLocale = useEffectEvent((nextLocale: AppLocale) => {
    document.documentElement.lang = nextLocale
    document.documentElement.dataset.locale = nextLocale
    window.localStorage.setItem(localeStorageKey, nextLocale)
  })

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(localeStorageKey)
    const nextLocale = resolveLocale(storedLocale ?? window.navigator.language)

    startTransition(() => {
      setLocale(nextLocale)
    })

    applyLocale(nextLocale)
  }, [])

  const copy = getWorldWeaverWebCopy(locale)
  const bootstrapSummary = bootstrapCatalog
  const apiRouteCatalog = bootstrapCatalog.api_routes
  const workerJobCatalog = bootstrapCatalog.worker_jobs

  useEffect(() => {
    const fallbackCatalog = createFallbackBootstrapCatalog(locale)

    setBootstrapCatalog(fallbackCatalog)
    setBootstrapSyncState({
      status: "loading",
      message: copy.bootstrapSync.loading,
    })

    let cancelled = false

    void getBootstrapCatalog(locale)
      .then((response) => {
        if (cancelled) {
          return
        }

        setBootstrapCatalog(response.data)
        setBootstrapSyncState({
          status: "success",
          message: formatTemplate(copy.bootstrapSync.success, {
            requestId: response.request_id,
          }),
        })
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setBootstrapCatalog(fallbackCatalog)
        setBootstrapSyncState({
          status: "error",
          message: formatTemplate(copy.bootstrapSync.error, {
            reason: getErrorMessage(error, locale),
          }),
        })
      })

    return () => {
      cancelled = true
    }
  }, [
    copy.bootstrapSync.error,
    copy.bootstrapSync.loading,
    copy.bootstrapSync.success,
    locale,
  ])

  const signalCards = [
    {
      label: copy.signalCards.services.label,
      value: bootstrapSummary.services.length.toString().padStart(2, "0"),
      summary: copy.signalCards.services.summary,
    },
    {
      label: copy.signalCards.routes.label,
      value: apiRouteCatalog.length.toString().padStart(2, "0"),
      summary: copy.signalCards.routes.summary,
    },
    {
      label: copy.signalCards.jobs.label,
      value: workerJobCatalog.length.toString().padStart(2, "0"),
      summary: copy.signalCards.jobs.summary,
    },
  ] as const

  function handleLocaleChange(nextLocale: AppLocale) {
    startTransition(() => {
      setLocale(nextLocale)
    })

    applyLocale(nextLocale)
  }

  return (
    <main className="story-shell" data-locale={locale}>
      <section className="hero-panel">
        <div className="hero-topbar">
          <div className="hero-topbar-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <div className="locale-meta">
              <p className="locale-label">{copy.localeSwitcher.eyebrow}</p>
              <p className="locale-description">
                {copy.localeSwitcher.description}
              </p>
            </div>
          </div>

          <div className="hero-topbar-side">
            <fieldset className="locale-switcher">
              <legend className="visually-hidden">
                {copy.localeSwitcher.title}
              </legend>
              {localeCatalog.map((entry) => (
                <button
                  aria-pressed={locale === entry.code}
                  className={`locale-button${
                    locale === entry.code ? " locale-button-active" : ""
                  }`}
                  key={entry.code}
                  onClick={() => {
                    handleLocaleChange(entry.code)
                  }}
                  type="button"
                >
                  <span className="locale-button-copy">
                    <span className="locale-button-title">
                      {entry.nativeLabel}
                    </span>
                    <span className="locale-button-meta">
                      {entry.shortLabel}
                    </span>
                  </span>
                </button>
              ))}
            </fieldset>

            <div className="hero-tags">
              {copy.hero.tags.map((tag) => (
                <span className="tag-pill" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-grid">
          <div>
            <h1 className="hero-title">{copy.hero.title}</h1>
            <p className="hero-copy">{bootstrapSummary.product_intent}</p>
            <div
              aria-live="polite"
              className={`feedback feedback-${bootstrapSyncState.status}`}
              role={bootstrapSyncState.status === "error" ? "alert" : undefined}
            >
              <div className="bootstrap-sync-banner">
                <span
                  className={`status-badge status-${bootstrapSyncState.status}`}
                >
                  {copy.bootstrapSync.label}
                </span>
                <p className="bootstrap-sync-copy">
                  {bootstrapSyncState.message}
                </p>
              </div>
            </div>

            <div className="hero-actions">
              <a className="jump-link" href="#control-center">
                {copy.hero.ctaLabel}
              </a>
              <p className="support-copy">{copy.hero.supportCopy}</p>
            </div>
          </div>

          <div className="chapter-column">
            <div className="signal-band">
              {signalCards.map((item) => (
                <article className="signal-card" key={item.label}>
                  <p className="signal-label">{item.label}</p>
                  <p className="signal-value">{item.value}</p>
                  <p className="signal-copy">{item.summary}</p>
                </article>
              ))}
            </div>

            <div className="chapter-rail">
              {bootstrapSummary.capabilities.map((capability) => (
                <article className="chapter-card" key={capability.id}>
                  <div className="chapter-heading">
                    <p className="chapter-title">{capability.title}</p>
                    <span className="tag-pill tag-pill-soft">
                      {copy.stageLabels[capability.stage]}
                    </span>
                  </div>
                  <p className="chapter-copy">{capability.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="story-grid">
        {bootstrapSummary.services.map((service) => (
          <article className="story-card" key={service.id}>
            <div className="story-card-header">
              <span className="tag-pill">{service.id}</span>
              <h2>{service.title}</h2>
            </div>
            <p className="story-card-copy">{service.summary}</p>
            <ul className="story-list">
              {service.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="workspace-panel" id="control-center">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{copy.sections.playableMvp.eyebrow}</p>
            <h2>{copy.sections.playableMvp.title}</h2>
          </div>
          <p className="section-copy">{copy.sections.playableMvp.copy}</p>
        </div>

        <WorldWeaverControlCenter copy={copy.controlCenter} locale={locale} />
      </section>

      <section className="catalog-grid">
        <article className="catalog-panel">
          <div className="section-heading section-heading-compact">
            <div>
              <p className="eyebrow">{copy.sections.routeInventory.eyebrow}</p>
              <h2>{copy.sections.routeInventory.title}</h2>
            </div>
            <p className="section-copy">{copy.sections.routeInventory.copy}</p>
          </div>
          <div className="catalog-stack">
            {apiRouteCatalog.map((route) => (
              <div
                className="catalog-row"
                key={`${route.method}-${route.path}`}
              >
                <div>
                  <p className="catalog-title">
                    <span className="tag-pill">{route.method}</span>{" "}
                    <span className="mono-text">{route.path}</span>
                  </p>
                  <p className="catalog-copy">{route.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="catalog-panel">
          <div className="section-heading section-heading-compact">
            <div>
              <p className="eyebrow">
                {copy.sections.infrastructureSignals.eyebrow}
              </p>
              <h2>{copy.sections.infrastructureSignals.title}</h2>
            </div>
            <p className="section-copy">
              {copy.sections.infrastructureSignals.copy}
            </p>
          </div>
          <div className="catalog-stack">
            {bootstrapSummary.infrastructure.map((target) => (
              <div className="catalog-row" key={target.name}>
                <div>
                  <p className="catalog-title">{target.name}</p>
                  <p className="catalog-copy">{target.role}</p>
                </div>
                <div className="chip-list">
                  {target.connection_env.map((item) => (
                    <span className="tag-pill tag-pill-soft" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="catalog-panel">
          <div className="section-heading section-heading-compact">
            <div>
              <p className="eyebrow">{copy.sections.asyncMemoryLoop.eyebrow}</p>
              <h2>{copy.sections.asyncMemoryLoop.title}</h2>
            </div>
            <p className="section-copy">{copy.sections.asyncMemoryLoop.copy}</p>
          </div>
          <div className="catalog-stack">
            {workerJobCatalog.map((job) => (
              <div className="catalog-row" key={job.id}>
                <div>
                  <p className="catalog-title">{job.id}</p>
                  <p className="catalog-copy">{job.summary}</p>
                </div>
                <span className="tag-pill tag-pill-soft">{job.trigger}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
