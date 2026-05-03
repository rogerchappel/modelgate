# Security Policy

## Supported Versions

`modelgate` is pre-1.0. The `main` branch and latest published 0.x release (when releases exist) receive best-effort security fixes.

| Version | Supported |
| --- | --- |
| `main` | Best effort |
| `0.x` | Best effort after first release |

## Reporting a Vulnerability

Please do not report suspected vulnerabilities in public issues, pull requests, or discussions.

Use GitHub private vulnerability reporting if it is enabled for the repository. If it is not enabled yet, open a public issue that asks for a private reporting channel without including exploit details, secrets, personal data, provider tokens, or private route configs.

## Project Security Boundaries

`modelgate` is intentionally local-first:

- It reads local JSON fixture files.
- It does not make provider API calls.
- It does not proxy LLM traffic.
- It does not read real API key values.
- It does not upload telemetry.

Sensitive provider secrets should never be committed to fixtures. Use environment variable names such as `OPENAI_API_KEY`, not the values.

## What to Include

When a private reporting path is available, include:

- A clear description of the issue.
- Affected versions, files, packages, workflows, or configuration.
- Steps to reproduce, proof of concept, or attack scenario when safe to share.
- Potential impact.
- Suggested mitigation, if known.

## Scope

In scope:

- Vulnerabilities in `modelgate`.
- Unsafe parsing, CLI, reporting, package, or CI behavior shipped here.
- Insecure default fixture or documentation patterns.

Out of scope:

- General support requests.
- Findings caused by downstream private configs that are not part of this repo.
- Provider outages, billing policies, or API behavior outside `modelgate`.

## Disclosure

Coordinate disclosure with maintainers before publishing vulnerability details.
