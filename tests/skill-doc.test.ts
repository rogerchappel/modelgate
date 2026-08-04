import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, run } from "../src/cli.js";

async function skillCommands(): Promise<string[][]> {
  const skill = await readFile("SKILL.md", "utf8");
  return [...skill.matchAll(/^modelgate (.+)$/gm)].map((match) => match[1]!.split(/\s+/));
}

test("packaged skill commands use supported CLI options", async () => {
  const commands = await skillCommands();
  assert.ok(commands.length > 0, "SKILL.md should include modelgate commands");
  for (const command of commands) assert.doesNotThrow(() => parseArgs(command));
});

test("skill report example writes output and warning-only samples succeed", async () => {
  const directory = await mkdtemp(join(tmpdir(), "modelgate-skill-"));
  const output = join(directory, "report.md");
  try {
    assert.equal(await run(["inspect", "fixtures/sample", "--format", "markdown", "--output", output]), 0);
    await access(output);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
