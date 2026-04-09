import { workerJobCatalog } from "@worldweaver/config"
import { env } from "./env.js"

console.info(`[worker] ${env.WORKER_NAME} booted in ${env.NODE_ENV} mode`)
console.info(`[worker] postgres -> ${env.POSTGRES_URL}`)
console.info(`[worker] redis -> ${env.REDIS_URL}`)
console.info(`[worker] qdrant -> ${env.QDRANT_URL}`)
console.info("[worker] registered jobs:")

for (const job of workerJobCatalog) {
  console.info(`- ${job.id}: ${job.summary}`)
}

setInterval(() => {
  console.info(
    `[worker] heartbeat ${new Date().toISOString()} (${workerJobCatalog.length} jobs registered)`,
  )
}, env.WORKER_HEARTBEAT_MS)
