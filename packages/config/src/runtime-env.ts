import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { loadEnvFile } from "node:process"
import { fileURLToPath } from "node:url"

function findAncestor(startDirectory: string, marker: string) {
  let currentDirectory = startDirectory

  while (true) {
    if (existsSync(resolve(currentDirectory, marker))) {
      return currentDirectory
    }

    const parentDirectory = resolve(currentDirectory, "..")

    if (parentDirectory === currentDirectory) {
      throw new Error(`Unable to find ${marker} from ${startDirectory}`)
    }

    currentDirectory = parentDirectory
  }
}

export function loadLocalRuntimeEnv(metaUrl: string) {
  const nodeEnv = process.env.NODE_ENV ?? "development"

  if (nodeEnv === "production") {
    return
  }

  const moduleDirectory = dirname(fileURLToPath(metaUrl))
  const packageRoot = findAncestor(moduleDirectory, "package.json")
  const repoRoot = findAncestor(packageRoot, "pnpm-workspace.yaml")
  const candidates = [
    resolve(repoRoot, ".env.local"),
    resolve(repoRoot, ".env"),
  ]

  for (const filePath of candidates) {
    if (!existsSync(filePath)) {
      continue
    }

    loadEnvFile(filePath)
  }
}
