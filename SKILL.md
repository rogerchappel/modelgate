# ModelGate Skill

Use this skill when an agent needs to audit LLM provider, model, route, fallback, and budget configuration without proxying live requests.

## When To Use

- A repository contains redacted provider and route fixtures that need review.
- An agent is preparing a model-routing change and needs a dry-run report.
- CI should fail on missing primaries, disabled routes, absent fallbacks, duplicate route ids, or budget ceilings.

## Inputs

- A workspace directory containing `providers.json` and `routes.json`.
- Optional token assumptions through CLI flags for input and output token volumes.
- Redacted provider metadata only. Do not include live API keys.

## Side Effects

ModelGate reads local fixture files and writes reports only when an output path is requested. It does not call model providers, proxy prompts, load credentials, publish telemetry, or mutate provider configuration.

## Approval Boundaries

Treat ModelGate as a planning and inspection tool. Do not switch production routes, spend model budget, rotate keys, or edit live gateway settings unless the user explicitly approves that separate external action.

## Workflow

1. Run `modelgate inspect fixtures/sample --format markdown`.
2. Use `--format json` when another agent or CI job needs stable structured findings.
3. Review `error` findings first, then warnings about missing fallbacks, disabled models, and budget ceilings.
4. Adjust redacted fixtures or route policy, then rerun the inspection.
5. Capture the command and report path in PR evidence.

## Example

```bash
modelgate inspect fixtures/sample --format markdown --out out/report.md
modelgate inspect fixtures/sample --format json --input-tokens 2000000 --output-tokens 500000
```

## Verification

For repository changes, run `npm run check`, `npm test`, `npm run smoke`, and `npm run package:smoke`.
