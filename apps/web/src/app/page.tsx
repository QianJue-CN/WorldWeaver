import {
  apiRouteCatalog,
  bootstrapSummary,
  workerJobCatalog,
} from "@worldweaver/config"
import { WorldWeaverControlCenter } from "../components/worldweaver-control-center"

const stageLabel = {
  foundation: "Foundation Systems",
  mvp: "Playable Loop",
  next: "Expansion Slot",
} as const

export default function HomePage() {
  const signalCards = [
    {
      label: "Service surfaces",
      value: bootstrapSummary.services.length.toString().padStart(2, "0"),
      summary: "Web, API, and worker stay aligned around shared contracts.",
    },
    {
      label: "Typed API routes",
      value: apiRouteCatalog.length.toString().padStart(2, "0"),
      summary:
        "Every local workflow in this page maps to a live placeholder route.",
    },
    {
      label: "Queued memory jobs",
      value: workerJobCatalog.length.toString().padStart(2, "0"),
      summary:
        "Async extraction and summarization are already reserved in the flow.",
    },
  ] as const

  return (
    <main className="story-shell">
      <section className="hero-panel">
        <div className="hero-topbar">
          <p className="eyebrow">Local RPG Control Center</p>
          <div className="hero-tags">
            <span className="tag-pill">World Builder</span>
            <span className="tag-pill tag-pill-soft">Session Chat</span>
            <span className="tag-pill tag-pill-soft">Memory Pipeline</span>
          </div>
        </div>

        <div className="hero-grid">
          <div>
            <h1 className="hero-title">
              Author the world, launch the session, and keep long-form memory in
              view.
            </h1>
            <p className="hero-copy">{bootstrapSummary.product_intent}</p>

            <div className="hero-actions">
              <a className="jump-link" href="#control-center">
                Open the local control center
              </a>
              <p className="support-copy">
                Powered by placeholder API contracts that already mirror the
                first product loop.
              </p>
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
                      {stageLabel[capability.stage]}
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
            <p className="eyebrow">Playable MVP</p>
            <h2>Move from scaffold visibility to real local interaction.</h2>
          </div>
          <p className="section-copy">
            This first pass keeps everything on one route so we can exercise the
            full world-to-session loop against the placeholder Fastify service.
          </p>
        </div>

        <WorldWeaverControlCenter />
      </section>

      <section className="catalog-grid">
        <article className="catalog-panel">
          <div className="section-heading section-heading-compact">
            <div>
              <p className="eyebrow">Route Inventory</p>
              <h2>Current API surface</h2>
            </div>
            <p className="section-copy">
              These contracts remain the typed backbone for local web flows.
            </p>
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
              <p className="eyebrow">Infrastructure Signals</p>
              <h2>Stateful backbone</h2>
            </div>
            <p className="section-copy">
              The control center keeps these service boundaries visible while
              the backend remains scaffolded.
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
              <p className="eyebrow">Async Memory Loop</p>
              <h2>Worker jobs already reserved</h2>
            </div>
            <p className="section-copy">
              Each user action in the web MVP hints at the pipeline that will
              sit behind it later.
            </p>
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
