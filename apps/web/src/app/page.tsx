import {
  apiRouteCatalog,
  bootstrapSummary,
  workerJobCatalog,
} from "@worldweaver/config"

const stageLabel = {
  foundation: "Foundation",
  mvp: "MVP",
  next: "Next",
} as const

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Project Scaffold</p>
        <h1>{bootstrapSummary.project_name}</h1>
        <p className="lede">{bootstrapSummary.product_intent}</p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Service Map</h2>
          <p>
            Each app and package mirrors the boundaries in the product document.
          </p>
        </div>
        <div className="card-grid">
          {bootstrapSummary.services.map((service) => (
            <article className="card" key={service.id}>
              <div className="card-header">
                <span className="chip">{service.id}</span>
                <h3>{service.title}</h3>
              </div>
              <p>{service.summary}</p>
              <ul>
                {service.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="split">
        <article className="panel">
          <div className="panel-heading">
            <h2>Capability Roadmap</h2>
            <p>The scaffold already reserves the first product slices.</p>
          </div>
          <div className="stack">
            {bootstrapSummary.capabilities.map((capability) => (
              <div className="row" key={capability.id}>
                <div>
                  <p className="row-title">{capability.title}</p>
                  <p className="row-copy">{capability.summary}</p>
                </div>
                <span className="chip chip-soft">
                  {stageLabel[capability.stage]}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Worker Jobs</h2>
            <p>Async boundaries planned from day one.</p>
          </div>
          <div className="stack">
            {workerJobCatalog.map((job) => (
              <div className="row" key={job.id}>
                <div>
                  <p className="row-title">{job.id}</p>
                  <p className="row-copy">{job.summary}</p>
                </div>
                <span className="chip chip-soft">{job.trigger}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Initial API Surface</h2>
          <p>
            Placeholder routes already validate inputs and return stable
            envelopes.
          </p>
        </div>
        <div className="stack">
          {apiRouteCatalog.map((route) => (
            <div className="row" key={`${route.method}-${route.path}`}>
              <div>
                <p className="row-title">
                  <span className="chip">{route.method}</span> {route.path}
                </p>
                <p className="row-copy">{route.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
