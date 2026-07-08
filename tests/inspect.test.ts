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
