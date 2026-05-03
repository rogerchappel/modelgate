import test from "node:test";
import assert from "node:assert/strict";
import { loadWorkspace, validateWorkspace } from "../src/index.js";

test("loadWorkspace reads provider and route fixture files", async () => {
  const workspace = await loadWorkspace("fixtures/sample");
  assert.equal(workspace.providers[0]?.id, "openai-prod");
  assert.equal(workspace.routes[0]?.id, "agent-default");
});

test("validateWorkspace rejects malformed provider shape", () => {
  assert.throws(() => validateWorkspace({ providers: [{ id: "bad", models: [{}] }], routes: [] } as never), /models\[0\]\.id/);
});
