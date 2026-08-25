import { estimateModelUsd, roundUsd } from "./cost.js";
import type { Finding, InspectOptions, InspectionReport, ResolvedModel, RouteConfig, WorkspaceConfig } from "./types.js";

const DEFAULT_INPUT_TOKENS = 1_000_000;
const DEFAULT_OUTPUT_TOKENS = 250_000;

export function flattenModels(config: WorkspaceConfig): Map<string, ResolvedModel> {
  const models = new Map<string, ResolvedModel>();
  for (const provider of config.providers) {
    for (const model of provider.models) {
      const resolved: ResolvedModel = {
        ...model,
        providerName: provider.displayName ?? provider.id,
        keyEnv: provider.env ?? []
      };
      if (provider.kind !== undefined) resolved.providerKind = provider.kind;
      if (!models.has(model.id)) models.set(model.id, resolved);
    }
  }
  return models;
}

function hasRequiredTags(route: RouteConfig, model: ResolvedModel): boolean {
  if (!route.requireTags?.length) return true;
  const tags = new Set(model.tags ?? []);
  return route.requireTags.every((tag) => tags.has(tag));
}

function addPriceCeilingFindings(findings: Finding[], route: RouteConfig, model: ResolvedModel): void {
  if (route.maxInputPerMillion !== undefined && model.cost.inputPerMillion > route.maxInputPerMillion) {
    findings.push({ severity: "warning", code: "budget.input-ceiling", routeId: route.id, modelId: model.id, message: `${model.id} input price exceeds ${route.id} ceiling.` });
  }
  if (route.maxOutputPerMillion !== undefined && model.cost.outputPerMillion > route.maxOutputPerMillion) {
    findings.push({ severity: "warning", code: "budget.output-ceiling", routeId: route.id, modelId: model.id, message: `${model.id} output price exceeds ${route.id} ceiling.` });
  }
}

export function inspectWorkspace(config: WorkspaceConfig, options: InspectOptions = {}): InspectionReport {
  const inputTokens = options.inputTokens ?? DEFAULT_INPUT_TOKENS;
  const outputTokens = options.outputTokens ?? DEFAULT_OUTPUT_TOKENS;
  const findings: Finding[] = [];
  const models = flattenModels(config);
  const seenProviders = new Set<string>();
  const seenModels = new Map<string, string>();
  const seenRoutes = new Set<string>();

  for (const [providerIndex, provider] of config.providers.entries()) {
    if (seenProviders.has(provider.id)) {
      findings.push({ severity: "error", code: "provider.duplicate-id", message: `Provider id ${provider.id} is declared more than once.` });
    }
    seenProviders.add(provider.id);
    for (const [modelIndex, model] of provider.models.entries()) {
      if (model.provider !== provider.id) {
        findings.push({
          severity: "error",
          code: "model.provider-mismatch",
          modelId: model.id,
          message: `providers[${providerIndex}].models[${modelIndex}].provider (${model.provider}) must match providers[${providerIndex}].id (${provider.id}).`
        });
      }
      const firstProvider = seenModels.get(model.id);
      if (firstProvider !== undefined) {
        findings.push({
          severity: "error",
          code: "model.duplicate-id",
          modelId: model.id,
          message: `Model id ${model.id} is declared more than once (first in provider ${firstProvider}, again in provider ${provider.id}).`
        });
      } else {
        seenModels.set(model.id, provider.id);
      }
    }
    if (!provider.env?.length && provider.kind !== "local") {
      findings.push({ severity: "warning", code: "provider.missing-env", message: `${provider.id} has no env key names documented.` });
    }
  }

  for (const [routeIndex, route] of config.routes.entries()) {
    if (seenRoutes.has(route.id)) {
      findings.push({ severity: "error", code: "route.duplicate-id", routeId: route.id, message: `Route id ${route.id} is declared more than once.` });
    }
    seenRoutes.add(route.id);
    const primary = models.get(route.primary);
    if (!primary) {
      findings.push({ severity: "error", code: "route.primary-missing", routeId: route.id, modelId: route.primary, message: `${route.id} primary model ${route.primary} is not defined.` });
      continue;
    }
    if (primary.enabled === false) {
      findings.push({ severity: "error", code: "route.primary-disabled", routeId: route.id, modelId: primary.id, message: `${route.id} primary model ${primary.id} is disabled.` });
    }
    if (!route.fallbacks?.length) {
      findings.push({ severity: "warning", code: "route.no-fallback", routeId: route.id, message: `${route.id} has no fallback model.` });
    }
    if (route.monthlyBudgetUsd === undefined) {
      findings.push({ severity: "info", code: "route.no-budget", routeId: route.id, message: `${route.id} does not declare a monthly budget.` });
    }
    if (!hasRequiredTags(route, primary)) {
      findings.push({ severity: "warning", code: "route.primary-tags", routeId: route.id, modelId: primary.id, message: `${primary.id} does not satisfy required tags for ${route.id}.` });
    }
    addPriceCeilingFindings(findings, route, primary);
    const seenFallbacks = new Set<string>();
    for (const [fallbackIndex, fallbackId] of (route.fallbacks ?? []).entries()) {
      if (fallbackId === route.primary) {
        findings.push({
          severity: "error",
          code: "route.fallback-is-primary",
          routeId: route.id,
          modelId: fallbackId,
          message: `${route.id} fallback at routes[${routeIndex}].fallbacks[${fallbackIndex}] repeats its primary model ${fallbackId}.`
        });
        continue;
      }
      if (seenFallbacks.has(fallbackId)) {
        findings.push({
          severity: "error",
          code: "route.fallback-duplicate",
          routeId: route.id,
          modelId: fallbackId,
          message: `${route.id} fallback at routes[${routeIndex}].fallbacks[${fallbackIndex}] repeats fallback model ${fallbackId}.`
        });
        continue;
      }
      seenFallbacks.add(fallbackId);
      const fallback = models.get(fallbackId);
      if (!fallback) {
        findings.push({ severity: "error", code: "route.fallback-missing", routeId: route.id, modelId: fallbackId, message: `${route.id} fallback model ${fallbackId} is not defined.` });
        continue;
      }
      if (fallback.enabled === false) findings.push({ severity: "warning", code: "route.fallback-disabled", routeId: route.id, modelId: fallback.id, message: `${route.id} fallback ${fallback.id} is disabled.` });
      if (!hasRequiredTags(route, fallback)) findings.push({ severity: "warning", code: "route.fallback-tags", routeId: route.id, modelId: fallback.id, message: `${fallback.id} does not satisfy required tags for ${route.id}.` });
      addPriceCeilingFindings(findings, route, fallback);
    }
  }

  const estimates = config.routes.map((route) => {
    const primary = models.get(route.primary);
    const distinctFallbackIds = [...new Set(route.fallbacks ?? [])].filter((id) => id !== route.primary);
    const fallbackCosts = distinctFallbackIds.map((id) => models.get(id)).filter((model): model is ResolvedModel => Boolean(model)).map((model) => estimateModelUsd(model, inputTokens, outputTokens));
    const estimatedPrimaryUsd = primary ? estimateModelUsd(primary, inputTokens, outputTokens) : 0;
    const estimatedFallbackUsd = roundUsd(fallbackCosts.reduce((sum, value) => sum + value, 0));
    const budgetStatus: "ok" | "over" | "missing" = route.monthlyBudgetUsd === undefined ? "missing" : estimatedPrimaryUsd <= route.monthlyBudgetUsd ? "ok" : "over";
    return { routeId: route.id, primary: route.primary, fallbackCount: distinctFallbackIds.length, estimatedPrimaryUsd, estimatedFallbackUsd, budgetStatus };
  });

  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;

  return {
    generatedAt: new Date(0).toISOString(),
    summary: { providers: config.providers.length, models: models.size, routes: config.routes.length, findings: findings.length, errors, warnings },
    estimates,
    findings
  };
}
