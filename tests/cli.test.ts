import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, run } from "../src/cli.js";

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

test("parseArgs accepts zero token overrides", () => {
  const options = parseArgs(["inspect", "fixtures/sample", "--input-tokens", "0", "--output-tokens", "0"]);
  assert.equal(options.inputTokens, 0);
  assert.equal(options.outputTokens, 0);
});

test("parseArgs rejects missing and option-shaped values", () => {
  for (const args of [
    ["--format"], ["--format", "--output"], ["--output"], ["-o", "--format"],
    ["--input-tokens"], ["--input-tokens", "--output-tokens"],
    ["--output-tokens"], ["--output-tokens", "--format"]
  ]) {
    assert.throws(() => parseArgs(["inspect", "fixtures/sample", ...args]), /requires|must be/);
  }
});

test("parseArgs rejects duplicate options and invalid token counts", () => {
  assert.throws(
    () => parseArgs(["inspect", "fixtures/sample", "--output", "one", "-o", "two"]),
    /--output may only be specified once/
  );
  assert.throws(
    () => parseArgs(["inspect", "fixtures/sample", "--format", "json", "--format", "markdown"]),
    /--format may only be specified once/
  );
  for (const flag of ["--input-tokens", "--output-tokens"]) {
    assert.throws(
      () => parseArgs(["inspect", "fixtures/sample", flag, "1", flag, "2"]),
      new RegExp(`${flag} may only be specified once`)
    );
  }
  for (const value of ["nope", "Infinity", "-1"]) {
    assert.throws(() => parseArgs(["inspect", "fixtures/sample", "--input-tokens", value]), /non-negative number/);
  }
});

test("CLI rejects missing token values without producing a report", async () => {
  const directory = await mkdtemp(join(tmpdir(), "modelgate-cli-"));
  try {
    for (const flag of ["--input-tokens", "--output-tokens"]) {
      const output = join(directory, `${flag.slice(2)}.md`);
      assert.equal(await run(["inspect", "fixtures/sample", "--output", output, flag]), 1);
      await assert.rejects(access(output));
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI does not treat an option as an output path", async () => {
  const optionPath = join(process.cwd(), "--input-tokens");
  try {
    assert.equal(await run(["inspect", "fixtures/sample", "--output", "--input-tokens"]), 1);
    await assert.rejects(access(optionPath));
  } finally {
    await rm(optionPath, { force: true });
  }
});

test("inspect returns configuration error status for duplicate model ids", async () => {
  assert.equal(await run(["inspect", "fixtures/duplicate-models", "--output", "out/duplicate-models.md"]), 2);
});
