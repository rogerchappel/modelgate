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
