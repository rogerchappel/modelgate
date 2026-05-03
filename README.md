# modelgate

`modelgate` is a small local-first CLI and TypeScript library for reviewing LLM provider configs before an agent or app spends real money.

It reads redacted JSON fixtures, estimates route costs, checks fallback coverage, and emits a JSON or Markdown report. It does **not** proxy API calls, read credentials, phone home, or mutate provider settings.

## Why

Agent stacks tend to grow provider configs faster than humans can review them. `modelgate` gives you a cheap pre-flight check:

- Which models are routed where?
- Do important routes have fallbacks?
- Are prices over the route's stated ceiling?
- Are private/offline routes accidentally pointed at a hosted model?
- Can CI or another agent inspect the plan without touching secrets?

## Install

```sh
npm install
npm run build
```

For local CLI use from this checkout:

```sh
node dist/src/cli.js --help
```

After package installation, use:

```sh
modelgate inspect fixtures/sample
```

## Quickstart

```sh
npm test
npm run smoke
node dist/src/cli.js inspect fixtures/sample --format markdown
node dist/src/cli.js inspect fixtures/sample --format json --output out/report.json
```

Example output includes a route estimate table and findings such as `route.no-fallback` or `budget.output-ceiling`.

## Fixture shape

`modelgate inspect <directory>` expects:

```text
<directory>/providers.json
<directory>/routes.json
```

`providers.json` contains provider IDs, documented env var names, and model cost metadata. `routes.json` contains primary model IDs, fallback IDs, optional budgets, price ceilings, and required tags.

See [`fixtures/sample`](fixtures/sample) and [`examples/provider-config.md`](examples/provider-config.md).

## Library API

```ts
import { inspectWorkspace, loadWorkspace, formatMarkdown } from "modelgate";

const workspace = await loadWorkspace("fixtures/sample");
const report = inspectWorkspace(workspace);
console.log(formatMarkdown(report));
```

## Safety boundaries

- Local files only: no hidden network calls.
- Redacted metadata only: never put real API keys in fixtures.
- No proxy mode in V1: `modelgate` audits configs; it does not sit in the request path.
- Deterministic reports: timestamps are pinned so fixture-backed tests stay stable.
- Exit code `2` means inspection completed and found configuration errors.

## Attribution

This is an original local-first OSS concept inspired by demand signals around LiteLLM-adjacent tooling, including the `litellm fork` noted in [`docs/PRD.md`](docs/PRD.md). It does not copy that project's name, implementation, or runtime behavior.

## Verify

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and skips optional `agent-qc` if it is not installed.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Small, fixture-backed changes are easiest to review.

## Security

See [SECURITY.md](SECURITY.md). Please do not file issues containing credentials, provider tokens, or private route configs.

## License

MIT
