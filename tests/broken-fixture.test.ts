import test from "node:test";
import assert from "node:assert/strict";
import { inspectWorkspace, loadWorkspace } from "../src/index.js";

test("broken fixture produces actionable errors and warnings", async () => {
  const report = inspectWorkspace(await loadWorkspace("fixtures/broken"));
  assert.equal(report.summary.errors, 1);
  assert.ok(report.summary.warnings >= 1);
  assert.ok(report.findings.some((finding) => finding.code === "provider.missing-env"));
  assert.ok(report.findings.some((finding) => finding.code === "route.primary-missing"));
});
