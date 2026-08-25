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

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new ConfigError(`${label} must be an object`);
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") throw new ConfigError(`${label} must be a non-empty string`);
}

function assertNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new ConfigError(`${label} must be a non-negative number`);
}

function assertPositiveNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new ConfigError(`${label} must be a positive number`);
}

function assertBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== "boolean") throw new ConfigError(`${label} must be a boolean`);
}

function assertStringArray(value: unknown, label: string): asserts value is string[] {
  assertArray(value, label);
  for (const [index, entry] of value.entries()) assertString(entry, `${label}[${index}]`);
}

export function validateWorkspace(config: WorkspaceConfig): WorkspaceConfig {
  assertArray(config.providers, "providers");
  assertArray(config.routes, "routes");

  for (const [providerIndex, provider] of config.providers.entries()) {
    const providerLabel = `providers[${providerIndex}]`;
    assertObject(provider, providerLabel);
    assertString(provider.id, `${providerLabel}.id`);
    if (provider.kind !== undefined) {
      assertString(provider.kind, `${providerLabel}.kind`);
      if (!["openai", "anthropic", "google", "local", "custom"].includes(provider.kind)) {
        throw new ConfigError(`${providerLabel}.kind must be openai, anthropic, google, local, or custom`);
      }
    }
    if (provider.displayName !== undefined) assertString(provider.displayName, `${providerLabel}.displayName`);
    if (provider.env !== undefined) assertStringArray(provider.env, `${providerLabel}.env`);
    if (provider.baseUrl !== undefined) assertString(provider.baseUrl, `${providerLabel}.baseUrl`);
    assertArray(provider.models, `${providerLabel}.models`);
    for (const [modelIndex, model] of provider.models.entries()) {
      const modelLabel = `${providerLabel}.models[${modelIndex}]`;
      assertObject(model, modelLabel);
      assertString(model.id, `${modelLabel}.id`);
      assertString(model.provider, `${modelLabel}.provider`);
      if (model.provider !== provider.id) {
        throw new ConfigError(`${modelLabel}.provider must match ${providerLabel}.id (${provider.id})`);
      }
      if (model.contextWindow !== undefined) assertPositiveNumber(model.contextWindow, `${modelLabel}.contextWindow`);
      assertObject(model.cost, `${modelLabel}.cost`);
      assertNumber(model.cost.inputPerMillion, `${modelLabel}.cost.inputPerMillion`);
      assertNumber(model.cost.outputPerMillion, `${modelLabel}.cost.outputPerMillion`);
      if (model.cost.currency !== undefined) assertString(model.cost.currency, `${modelLabel}.cost.currency`);
      if (model.tags !== undefined) assertStringArray(model.tags, `${modelLabel}.tags`);
      if (model.enabled !== undefined) assertBoolean(model.enabled, `${modelLabel}.enabled`);
    }
  }

  for (const [routeIndex, route] of config.routes.entries()) {
    const routeLabel = `routes[${routeIndex}]`;
    assertObject(route, routeLabel);
    assertString(route.id, `${routeLabel}.id`);
    if (route.description !== undefined) assertString(route.description, `${routeLabel}.description`);
    assertString(route.primary, `${routeLabel}.primary`);
    if (route.fallbacks !== undefined) assertStringArray(route.fallbacks, `${routeLabel}.fallbacks`);
    if (route.monthlyBudgetUsd !== undefined) assertNumber(route.monthlyBudgetUsd, `${routeLabel}.monthlyBudgetUsd`);
    if (route.maxInputPerMillion !== undefined) assertNumber(route.maxInputPerMillion, `${routeLabel}.maxInputPerMillion`);
    if (route.maxOutputPerMillion !== undefined) assertNumber(route.maxOutputPerMillion, `${routeLabel}.maxOutputPerMillion`);
    if (route.requireTags !== undefined) assertStringArray(route.requireTags, `${routeLabel}.requireTags`);
  }

  return config;
}

export async function loadWorkspace(inputDir: string): Promise<WorkspaceConfig> {
  const providers = await readJson<ProviderConfig[]>(join(inputDir, "providers.json"));
  const routes = await readJson<RouteConfig[]>(join(inputDir, "routes.json"));
  return validateWorkspace({ providers, routes });
}
