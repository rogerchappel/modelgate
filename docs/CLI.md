# CLI Reference

Install the `modelgate-cli` package to provide the `modelgate` executable:

```sh
npm install modelgate-cli
```

## `modelgate inspect <directory>`

Reads `<directory>/providers.json` and `<directory>/routes.json`, then writes a local inspection report.
Provider, model, and route IDs must be unique in their respective workspace scopes; model IDs are global because routes refer to them without a provider qualifier.

Options:

- `--format markdown|json` — output format, default `markdown`.
- `--output <file>`, `-o <file>` — write the report to a file instead of stdout.
- `--input-tokens <number>` — estimate scenario input tokens, default `1000000`.
- `--output-tokens <number>` — estimate scenario output tokens, default `250000`.

Exit codes:

- `0` — inspection completed with no configuration errors; warning-only reports also exit successfully.
- `1` — CLI usage, file, or JSON parse failure.
- `2` — inspection completed and found configuration errors.

Warnings such as missing fallbacks and budget ceilings are advisory. Input and output price ceilings apply to the resolved primary and every valid, distinct fallback in the full route chain; each over-ceiling model receives a route- and model-specific finding. CI that needs a stricter project-specific policy can inspect the JSON report and decide which warnings to promote to failures.

Fallback chains are ordered, but each fallback model ID may appear only once and the primary model cannot also be a fallback. Violations are configuration errors, are omitted from fallback cost totals, and produce exit code `2`.
