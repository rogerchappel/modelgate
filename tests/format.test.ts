import test from "node:test";
import assert from "node:assert/strict";
import { formatJson, formatMarkdown, inspectWorkspace, loadWorkspace } from "../src/index.js";

test("formats report as markdown and json", async () => {
  const report = inspectWorkspace(await loadWorkspace("fixtures/sample"));
  assert.match(formatMarkdown(report), /# modelgate inspection/);
  assert.match(formatMarkdown(report), /agent-default/);
  assert.equal(JSON.parse(formatJson(report)).summary.routes, 2);
});
