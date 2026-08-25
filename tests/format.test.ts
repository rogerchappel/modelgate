import test from "node:test";
import assert from "node:assert/strict";
import { formatJson, formatMarkdown, inspectWorkspace, loadWorkspace } from "../src/index.js";

test("formats report as markdown and json", async () => {
  const report = inspectWorkspace(await loadWorkspace("fixtures/sample"));
  assert.match(formatMarkdown(report), /# modelgate inspection/);
  assert.match(formatMarkdown(report), /agent-default/);
  assert.equal(JSON.parse(formatJson(report)).summary.routes, 2);
});

test("formats fallback-chain errors in markdown and json", () => {
  const report = inspectWorkspace({
    providers: [{ id: "local", kind: "local", models: [
      { id: "m", provider: "local", cost: { inputPerMillion: 1, outputPerMillion: 1 } },
      { id: "f", provider: "local", cost: { inputPerMillion: 2, outputPerMillion: 2 } }
    ] }],
    routes: [{ id: "r", primary: "m", fallbacks: ["m", "f", "f"] }]
  });
  assert.match(formatMarkdown(report), /route\.fallback-is-primary/);
  assert.match(formatMarkdown(report), /route\.fallback-duplicate/);
  assert.deepEqual(JSON.parse(formatJson(report)).estimates[0], {
    routeId: "r", primary: "m", fallbackCount: 1, estimatedPrimaryUsd: 1.25, estimatedFallbackUsd: 2.5, budgetStatus: "missing"
  });
});

test("formats fallback price-ceiling findings with route and model context", () => {
  const report = inspectWorkspace({
    providers: [{ id: "local", kind: "local", models: [
      { id: "primary", provider: "local", cost: { inputPerMillion: 1, outputPerMillion: 1 } },
      { id: "expensive", provider: "local", cost: { inputPerMillion: 20, outputPerMillion: 30 } }
    ] }],
    routes: [{ id: "limited", primary: "primary", fallbacks: ["expensive"], maxInputPerMillion: 10, maxOutputPerMillion: 10 }]
  });
  const markdown = formatMarkdown(report);
  assert.match(markdown, /budget\.input-ceiling.*limited \/ expensive/);
  assert.match(markdown, /budget\.output-ceiling.*limited \/ expensive/);
  assert.equal(JSON.parse(formatJson(report)).summary.warnings, 2);
});
