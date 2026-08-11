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

test("validateWorkspace accepts a model referencing its containing provider", () => {
  const workspace = { providers: [{ id: "outer", models: [{ id: "m", provider: "outer", cost: { inputPerMillion: 1, outputPerMillion: 1 } }] }], routes: [] };
  assert.equal(validateWorkspace(workspace).providers[0]?.models[0]?.provider, "outer");
});

test("validateWorkspace rejects a model referencing a different provider", () => {
  const workspace = { providers: [{ id: "outer", models: [{ id: "m", provider: "different", cost: { inputPerMillion: 1, outputPerMillion: 1 } }] }], routes: [] };
  assert.throws(() => validateWorkspace(workspace), /providers\[0\]\.models\[0\]\.provider must match providers\[0\]\.id \(outer\)/);
});

const validWorkspace = () => ({
  providers: [{
    id: "provider",
    kind: "custom",
    displayName: "Provider",
    env: ["API_KEY"],
    baseUrl: "https://example.test",
    models: [{
      id: "model",
      provider: "provider",
      contextWindow: 1000,
      cost: { inputPerMillion: 1, outputPerMillion: 2, currency: "USD" },
      tags: ["general"],
      enabled: true
    }]
  }],
  routes: [{
    id: "route",
    description: "Default route",
    primary: "model",
    fallbacks: ["model"],
    monthlyBudgetUsd: 10,
    maxInputPerMillion: 2,
    maxOutputPerMillion: 4,
    requireTags: ["general"]
  }]
});

test("validateWorkspace rejects malformed array entries with indexed paths", () => {
  const cases: Array<[string, (workspace: ReturnType<typeof validWorkspace>) => void]> = [
    ["providers[0].env[0]", (workspace) => { workspace.providers[0]!.env = [42 as never]; }],
    ["providers[0].models[0].tags[0]", (workspace) => { workspace.providers[0]!.models[0]!.tags = [false as never]; }],
    ["routes[0].fallbacks[0]", (workspace) => { workspace.routes[0]!.fallbacks = [{} as never]; }],
    ["routes[0].requireTags[0]", (workspace) => { workspace.routes[0]!.requireTags = [null as never]; }]
  ];

  for (const [path, mutate] of cases) {
    const workspace = validWorkspace();
    mutate(workspace);
    assert.throws(() => validateWorkspace(workspace as never), new RegExp(path.replaceAll("[", "\\[").replaceAll("]", "\\]")));
  }
});

test("validateWorkspace rejects malformed optional scalar fields", () => {
  const cases: Array<[string, (workspace: ReturnType<typeof validWorkspace>) => void]> = [
    ["providers[0].kind", (workspace) => { workspace.providers[0]!.kind = "invalid"; }],
    ["providers[0].displayName", (workspace) => { workspace.providers[0]!.displayName = 1 as never; }],
    ["providers[0].baseUrl", (workspace) => { workspace.providers[0]!.baseUrl = false as never; }],
    ["providers[0].models[0].contextWindow", (workspace) => { workspace.providers[0]!.models[0]!.contextWindow = -1; }],
    ["providers[0].models[0].cost.currency", (workspace) => { workspace.providers[0]!.models[0]!.cost.currency = 1 as never; }],
    ["providers[0].models[0].enabled", (workspace) => { workspace.providers[0]!.models[0]!.enabled = "false" as never; }],
    ["routes[0].description", (workspace) => { workspace.routes[0]!.description = 1 as never; }],
    ["routes[0].monthlyBudgetUsd", (workspace) => { workspace.routes[0]!.monthlyBudgetUsd = -1; }],
    ["routes[0].maxInputPerMillion", (workspace) => { workspace.routes[0]!.maxInputPerMillion = Number.POSITIVE_INFINITY; }],
    ["routes[0].maxOutputPerMillion", (workspace) => { workspace.routes[0]!.maxOutputPerMillion = "4" as never; }]
  ];

  for (const [path, mutate] of cases) {
    const workspace = validWorkspace();
    mutate(workspace);
    assert.throws(() => validateWorkspace(workspace as never), new RegExp(path.replaceAll("[", "\\[").replaceAll("]", "\\]")));
  }
});

test("validateWorkspace rejects non-object provider, model, cost, and route entries", () => {
  for (const [path, mutate] of [
    ["providers[0]", (workspace: ReturnType<typeof validWorkspace>) => { workspace.providers[0] = null as never; }],
    ["providers[0].models[0]", (workspace: ReturnType<typeof validWorkspace>) => { workspace.providers[0]!.models[0] = [] as never; }],
    ["providers[0].models[0].cost", (workspace: ReturnType<typeof validWorkspace>) => { workspace.providers[0]!.models[0]!.cost = null as never; }],
    ["routes[0]", (workspace: ReturnType<typeof validWorkspace>) => { workspace.routes[0] = "route" as never; }]
  ] as const) {
    const workspace = validWorkspace();
    mutate(workspace);
    assert.throws(() => validateWorkspace(workspace as never), new RegExp(path.replaceAll("[", "\\[").replaceAll("]", "\\]")));
  }
});
