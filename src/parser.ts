import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ConfigError } from "./errors.js";
import type { ProviderConfig, RouteConfig, WorkspaceConfig } from "./types.js";

async function readJson<T>(path: string): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    throw new ConfigError(`Could not read ${path}: ${(error as Error).message}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new ConfigError(`Invalid JSON in ${path}: ${(error as Error).message}`);
  }
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new ConfigError(`${label} must be an array`);
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") throw new ConfigError(`${label} must be a non-empty string`);
}

function assertNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new ConfigError(`${label} must be a non-negative number`);
}

export function validateWorkspace(config: WorkspaceConfig): WorkspaceConfig {
  assertArray(config.providers, "providers");
  assertArray(config.routes, "routes");

  for (const [providerIndex, provider] of config.providers.entries()) {
    assertString(provider.id, `providers[${providerIndex}].id`);
    assertArray(provider.models, `providers[${providerIndex}].models`);
    if (provider.env !== undefined) assertArray(provider.env, `providers[${providerIndex}].env`);
    for (const [modelIndex, model] of provider.models.entries()) {
      assertString(model.id, `providers[${providerIndex}].models[${modelIndex}].id`);
      assertString(model.provider, `providers[${providerIndex}].models[${modelIndex}].provider`);
      assertNumber(model.cost?.inputPerMillion, `${model.id}.cost.inputPerMillion`);
      assertNumber(model.cost?.outputPerMillion, `${model.id}.cost.outputPerMillion`);
    }
  }

  for (const [routeIndex, route] of config.routes.entries()) {
    assertString(route.id, `routes[${routeIndex}].id`);
    assertString(route.primary, `routes[${routeIndex}].primary`);
    if (route.fallbacks !== undefined) assertArray(route.fallbacks, `routes[${routeIndex}].fallbacks`);
  }

  return config;
}

export async function loadWorkspace(inputDir: string): Promise<WorkspaceConfig> {
  const providers = await readJson<ProviderConfig[]>(join(inputDir, "providers.json"));
  const routes = await readJson<RouteConfig[]>(join(inputDir, "routes.json"));
  return validateWorkspace({ providers, routes });
}
