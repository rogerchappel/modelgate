import test from "node:test";
import assert from "node:assert/strict";
import { inspectWorkspace, loadWorkspace } from "../src/index.js";

test("fixture inspection summarizes routes and non-fatal findings", async () => {
  const workspace = await loadWorkspace("fixtures/sample");
  const report = inspectWorkspace(workspace);
  assert.equal(report.summary.providers, 2);
  assert.equal(report.summary.models, 3);
  assert.equal(report.summary.routes, 2);
  assert.equal(report.summary.errors, 0);
  assert.ok(report.findings.some((finding) => finding.code === "route.no-fallback"));
  assert.equal(report.estimates[0]?.budgetStatus, "ok");
});

test("missing primary is reported as an error", () => {
  const report = inspectWorkspace({ providers: [], routes: [{ id: "broken", primary: "missing" }] });
  assert.equal(report.summary.errors, 1);
  assert.equal(report.findings[0]?.code, "route.primary-missing");
});

test("duplicate provider and route ids are reported as errors", () => {
  const report = inspectWorkspace({
    providers: [
      { id: "openai", kind: "openai", env: ["OPENAI_API_KEY"], models: [{ id: "fast", provider: "openai", cost: { inputPerMillion: 1, outputPerMillion: 2 } }] },
      { id: "openai", kind: "openai", env: ["OPENAI_API_KEY"], models: [{ id: "slow", provider: "openai", cost: { inputPerMillion: 2, outputPerMillion: 4 } }] }
    ],
    routes: [
      { id: "draft", primary: "fast", fallbacks: ["slow"] },
      { id: "draft", primary: "slow", fallbacks: ["fast"] }
    ]
  });

  assert.equal(report.summary.errors, 2);
  assert.ok(report.findings.some((finding) => finding.code === "provider.duplicate-id"));
  assert.ok(report.findings.some((finding) => finding.code === "route.duplicate-id"));
});

test("model provider references are checked against their containing provider", () => {
  const matching = inspectWorkspace({
    providers: [{ id: "outer", kind: "local", models: [{ id: "good", provider: "outer", cost: { inputPerMillion: 1, outputPerMillion: 1 } }] }],
    routes: []
  });
  assert.equal(matching.summary.errors, 0);

  const mismatched = inspectWorkspace({
    providers: [{ id: "outer", kind: "local", models: [{ id: "bad", provider: "different", cost: { inputPerMillion: 1, outputPerMillion: 1 } }] }],
    routes: []
  });
  assert.equal(mismatched.summary.errors, 1);
  assert.equal(mismatched.findings[0]?.code, "model.provider-mismatch");
  assert.match(mismatched.findings[0]?.message ?? "", /providers\[0\]\.models\[0\]\.provider \(different\)/);
});

test("model ids must be unique across providers and resolve to the first declaration", () => {
  const report = inspectWorkspace({
    providers: [
      { id: "first", kind: "local", models: [{ id: "shared", provider: "first", cost: { inputPerMillion: 1, outputPerMillion: 2 } }] },
      { id: "second", kind: "local", models: [{ id: "shared", provider: "second", cost: { inputPerMillion: 100, outputPerMillion: 200 } }] }
    ],
    routes: [{ id: "ambiguous", primary: "shared", fallbacks: [], monthlyBudgetUsd: 10 }]
  });

  assert.equal(report.summary.models, 1);
  assert.equal(report.summary.errors, 1);
  assert.equal(report.estimates[0]?.estimatedPrimaryUsd, 1.5);
  assert.deepEqual(
    report.findings.find((finding) => finding.code === "model.duplicate-id"),
    {
      severity: "error",
      code: "model.duplicate-id",
      modelId: "shared",
      message: "Model id shared is declared more than once (first in provider first, again in provider second)."
    }
  );
});

test("model ids must be unique within a provider", () => {
  const report = inspectWorkspace({
    providers: [{
      id: "local",
      kind: "local",
      models: [
        { id: "shared", provider: "local", cost: { inputPerMillion: 1, outputPerMillion: 2 } },
        { id: "shared", provider: "local", cost: { inputPerMillion: 3, outputPerMillion: 4 } }
      ]
    }],
    routes: []
  });

  assert.equal(report.summary.errors, 1);
  assert.ok(report.findings.some((finding) => finding.code === "model.duplicate-id"));
});

test("unique model ids remain valid", () => {
  const report = inspectWorkspace({
    providers: [{
      id: "local",
      kind: "local",
      models: [
        { id: "fast", provider: "local", cost: { inputPerMillion: 1, outputPerMillion: 2 } },
        { id: "slow", provider: "local", cost: { inputPerMillion: 3, outputPerMillion: 4 } }
      ]
    }],
    routes: [{ id: "default", primary: "fast", fallbacks: ["slow"] }]
  });

  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.models, 2);
});

test("fallback chains reject the primary and repeated fallback ids without double-counting estimates", () => {
  const report = inspectWorkspace({
    providers: [{
      id: "local",
      kind: "local",
      models: [
        { id: "primary", provider: "local", cost: { inputPerMillion: 1, outputPerMillion: 2 } },
        { id: "secondary", provider: "local", cost: { inputPerMillion: 2, outputPerMillion: 4 } }
      ]
    }],
    routes: [{ id: "invalid", primary: "primary", fallbacks: ["primary", "secondary", "secondary"] }]
  });

  assert.equal(report.summary.errors, 2);
  assert.deepEqual(report.findings.filter(({ severity }) => severity === "error").map(({ code }) => code), [
    "route.fallback-is-primary",
    "route.fallback-duplicate"
  ]);
  assert.match(report.findings.find(({ code }) => code === "route.fallback-is-primary")?.message ?? "", /routes\[0\]\.fallbacks\[0\]/);
  assert.match(report.findings.find(({ code }) => code === "route.fallback-duplicate")?.message ?? "", /routes\[0\]\.fallbacks\[2\]/);
  assert.equal(report.estimates[0]?.fallbackCount, 1);
  assert.equal(report.estimates[0]?.estimatedFallbackUsd, 3);
});

test("ordered distinct fallbacks remain valid and retain their estimate order count", () => {
  const report = inspectWorkspace({
    providers: [{
      id: "local",
      kind: "local",
      models: ["primary", "secondary", "tertiary"].map((id, index) => ({
        id,
        provider: "local",
        cost: { inputPerMillion: index + 1, outputPerMillion: index + 1 }
      }))
    }],
    routes: [{ id: "valid", primary: "primary", fallbacks: ["tertiary", "secondary"] }]
  });

  assert.equal(report.summary.errors, 0);
  assert.equal(report.estimates[0]?.fallbackCount, 2);
  assert.equal(report.estimates[0]?.estimatedFallbackUsd, 6.25);
});
