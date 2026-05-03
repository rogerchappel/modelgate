# CLI Reference

## `modelgate inspect <directory>`

Reads `<directory>/providers.json` and `<directory>/routes.json`, then writes a local inspection report.

Options:

- `--format markdown|json` — output format, default `markdown`.
- `--output <file>`, `-o <file>` — write the report to a file instead of stdout.
- `--input-tokens <number>` — estimate scenario input tokens, default `1000000`.
- `--output-tokens <number>` — estimate scenario output tokens, default `250000`.

Exit codes:

- `0` — inspection completed with no error findings.
- `1` — CLI usage, file, or JSON parse failure.
- `2` — inspection completed and found configuration errors.
