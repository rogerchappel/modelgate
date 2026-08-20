#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatJson, formatMarkdown } from "./format.js";
import { inspectWorkspace } from "./inspect.js";
import { loadWorkspace } from "./parser.js";

interface CliOptions {
  command: string;
  input?: string;
  format: "markdown" | "json";
  output?: string;
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
}

const help = `modelgate — local-first LLM route and cost inspector

Usage:
  modelgate inspect <directory> [--format markdown|json] [--output file] [--input-tokens n] [--output-tokens n]
  modelgate --help
  modelgate --version

Fixture shape:
  <directory>/providers.json
  <directory>/routes.json

Examples:
  modelgate inspect fixtures/sample
  modelgate inspect fixtures/sample --format json --output out/report.json
  modelgate inspect fixtures/sample --input-tokens 250000 --output-tokens 50000

Token overrides:
  --input-tokens n   Estimate each route with this input token count instead of route defaults
  --output-tokens n  Estimate each route with this output token count instead of route defaults
`;

function readPackageVersion(): string {
  return "0.1.0";
}

function parseNumber(value: string | undefined, label: string): number | undefined {
  if (value === undefined || value.startsWith("-")) throw new Error(`${label} requires a non-negative number`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative number`);
  return parsed;
}

function requireValue(value: string | undefined, label: string, description: string): string {
  if (value === undefined || value.startsWith("-")) throw new Error(`${label} requires ${description}`);
  return value;
}

export function parseArgs(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) return { command: "help", format: "markdown" };
  if (argv.includes("--version") || argv.includes("-v")) return { command: "version", format: "markdown" };
  const [command, input, ...rest] = argv;
  if (command !== "inspect" || !input) throw new Error("Expected: modelgate inspect <directory>. Run modelgate --help for details.");
  const options: CliOptions = { command, input, format: "markdown" };
  const seen = new Set<string>();
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]!;
    const next = rest[index + 1];
    const option = arg === "-o" ? "--output" : arg;
    if (seen.has(option)) throw new Error(`${option} may only be specified once`);
    if (arg === "--format") {
      requireValue(next, arg, "markdown or json");
      if (next !== "markdown" && next !== "json") throw new Error("--format must be markdown or json");
      options.format = next;
      seen.add(option);
      index += 1;
    } else if (arg === "--output" || arg === "-o") {
      options.output = requireValue(next, arg, "a path");
      seen.add(option);
      index += 1;
    } else if (arg === "--input-tokens") {
      options.inputTokens = parseNumber(next, arg);
      seen.add(option);
      index += 1;
    } else if (arg === "--output-tokens") {
      options.outputTokens = parseNumber(next, arg);
      seen.add(option);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

export async function run(argv = process.argv.slice(2)): Promise<number> {
  try {
    const options = parseArgs(argv);
    if (options.command === "help") {
      process.stdout.write(help);
      return 0;
    }
    if (options.command === "version") {
      process.stdout.write(`${readPackageVersion()}\n`);
      return 0;
    }
    const workspace = await loadWorkspace(options.input ?? ".");
    const inspectOptions = { inputTokens: options.inputTokens, outputTokens: options.outputTokens };
    const report = inspectWorkspace(workspace, inspectOptions);
    const rendered = options.format === "json" ? formatJson(report) : formatMarkdown(report);
    if (options.output) {
      await mkdir(dirname(options.output), { recursive: true });
      await writeFile(options.output, rendered, "utf8");
    } else {
      process.stdout.write(rendered);
    }
    return report.summary.errors > 0 ? 2 : 0;
  } catch (error) {
    process.stderr.write(`modelgate: ${(error as Error).message}\n`);
    return 1;
  }
}

const isDirectRun = process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  run().then((code) => {
    process.exitCode = code;
  });
}
