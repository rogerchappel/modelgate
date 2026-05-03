import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../src/cli.js";

test("parseArgs supports inspect json output", () => {
  assert.deepEqual(parseArgs(["inspect", "fixtures/sample", "--format", "json", "--output", "out/report.json"]), {
    command: "inspect",
    input: "fixtures/sample",
    format: "json",
    output: "out/report.json"
  });
});

test("parseArgs rejects unknown flags", () => {
  assert.throws(() => parseArgs(["inspect", "fixtures/sample", "--wat"]), /Unknown option/);
});
