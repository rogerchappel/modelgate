export type ProviderKind = "openai" | "anthropic" | "google" | "local" | "custom";

export interface ModelCost {
  inputPerMillion: number;
  outputPerMillion: number;
  currency?: string;
}

export interface ModelConfig {
  id: string;
  provider: string;
  contextWindow?: number;
  cost: ModelCost;
  tags?: string[];
  enabled?: boolean;
}

export interface ProviderConfig {
  id: string;
  kind?: ProviderKind;
  displayName?: string;
  env?: string[];
  baseUrl?: string;
  models: ModelConfig[];
}

export interface RouteConfig {
  id: string;
  description?: string;
  primary: string;
  fallbacks?: string[];
  monthlyBudgetUsd?: number;
  maxInputPerMillion?: number;
  maxOutputPerMillion?: number;
  requireTags?: string[];
}

export interface WorkspaceConfig {
  providers: ProviderConfig[];
  routes: RouteConfig[];
}

export interface ResolvedModel extends ModelConfig {
  providerKind?: ProviderKind | undefined;
  providerName?: string | undefined;
  keyEnv: string[];
}

export type Severity = "info" | "warning" | "error";

export interface Finding {
  severity: Severity;
  code: string;
  message: string;
  routeId?: string;
  modelId?: string;
}

export interface RouteEstimate {
  routeId: string;
  primary: string;
  fallbackCount: number;
  estimatedPrimaryUsd: number;
  estimatedFallbackUsd: number;
  budgetStatus: "ok" | "over" | "missing";
}

export interface InspectOptions {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
}

export interface InspectionReport {
  generatedAt: string;
  summary: {
    providers: number;
    models: number;
    routes: number;
    findings: number;
    errors: number;
    warnings: number;
  };
  estimates: RouteEstimate[];
  findings: Finding[];
}
