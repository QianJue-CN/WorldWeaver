import type { StoredEmbedding } from "../repositories/local-state.js"

export function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || left.length !== right.length) {
    return null
  }

  let dotProduct = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  for (const [index, leftValue] of left.entries()) {
    const rightValue = right[index]

    if (typeof rightValue !== "number") {
      return null
    }

    dotProduct += leftValue * rightValue
    leftMagnitude += leftValue * leftValue
    rightMagnitude += rightValue * rightValue
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return null
  }

  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude)
}

export function selectTopContexts(input: {
  queryVector: number[]
  candidates: StoredEmbedding[]
  limit?: number
}) {
  return input.candidates
    .map((candidate) => ({
      candidate,
      score: cosineSimilarity(input.queryVector, candidate.vector),
    }))
    .filter(
      (item): item is { candidate: StoredEmbedding; score: number } =>
        typeof item.score === "number" && item.score > 0,
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, input.limit ?? 2)
    .map((item) => item.candidate.content)
}
