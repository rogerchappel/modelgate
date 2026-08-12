import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

test("inspect exits nonzero with a field-specific provider mismatch diagnostic", async () => {
  const directory = await mkdtemp(join(tmpdir(), "modelgate-provider-mismatch-"));
  const stderrWrite = process.stderr.write;
  let stderr = "";
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  try {
    await writeFile(join(directory, "providers.json"), JSON.stringify([{ id: "outer", models: [{ id: "m", provider: "different", cost: { inputPerMillion: 1, outputPerMillion: 1 } }] }]));
    await writeFile(join(directory, "routes.json"), JSON.stringify([{ id: "r", primary: "m" }]));
    assert.equal(await run(["inspect", directory, "--format", "json"]), 1);
    assert.match(stderr, /providers\[0\]\.models\[0\]\.provider must match providers\[0\]\.id \(outer\)/);
  } finally {
    process.stderr.write = stderrWrite;
    await rm(directory, { recursive: true, force: true });
  }
});

test("inspect returns configuration error status for duplicate model ids", async () => {
  assert.equal(await run(["inspect", "fixtures/duplicate-models", "--output", "out/duplicate-models.md"]), 2);
});

test("inspect returns configuration error status for an invalid fallback chain", async () => {
  const directory = await mkdtemp(join(tmpdir(), "modelgate-fallback-chain-"));
  try {
    await writeFile(join(directory, "providers.json"), JSON.stringify([
      { id: "local", kind: "local", models: [{ id: "m", provider: "local", cost: { inputPerMillion: 1, outputPerMillion: 1 } }] }
    ]));
    await writeFile(join(directory, "routes.json"), JSON.stringify([
      { id: "r", primary: "m", fallbacks: ["m", "m"] }
    ]));
    const output = join(directory, "report.json");
    assert.equal(await run(["inspect", directory, "--format", "json", "--output", output]), 2);
    const report = JSON.parse(await readFile(output, "utf8"));
    assert.equal(report.summary.errors, 2);
    assert.equal(report.estimates[0].fallbackCount, 0);
    assert.equal(report.estimates[0].estimatedFallbackUsd, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
