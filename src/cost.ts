import type { ModelConfig } from "./types.js";

export function estimateModelUsd(model: ModelConfig, inputTokens: number, outputTokens: number): number {
  const input = (inputTokens / 1_000_000) * model.cost.inputPerMillion;
  const output = (outputTokens / 1_000_000) * model.cost.outputPerMillion;
  return roundUsd(input + output);
}

export function roundUsd(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
