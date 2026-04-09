export const localServiceDefaults = {
  apiHost: "127.0.0.1",
  apiPort: 4000,
  apiAllowedOrigins: "http://localhost:3000",
  postgresUrl: "postgresql://postgres:postgres@localhost:5432/worldweaver",
  redisUrl: "redis://localhost:6379",
  qdrantUrl: "http://localhost:6333",
  workerName: "worldweaver-worker",
  workerHeartbeatMs: 30000,
} as const
