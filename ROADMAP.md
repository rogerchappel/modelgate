# Roadmap

This roadmap is directional, not a delivery promise.

## Now

- Keep the V1 inspector deterministic, local-first, and fixture-backed.
- Improve validation messages for provider, model, and route shape mistakes.
- Add examples that mirror real agent/developer routing reviews.

## Next

- Add optional SARIF or GitHub-friendly annotations for CI reviews.
- Support multiple named traffic profiles for cost estimates.
- Add richer policy checks for private/offline routes and fallback classes.
- Document migration patterns from ad-hoc spreadsheets or README tables.

## Later

- Consider a tiny TUI or HTML report if users want visual review.
- Consider schema export for editor validation.
- Consider integration examples for agent orchestrators, without becoming a proxy.

## Not Planned

- Reading or storing API key values.
- Hidden network calls or telemetry.
- Runtime LLM request proxying in V1.
- Provider-specific billing guarantees; estimates are review aids, not invoices.

## Roadmap Review

Before each meaningful release:

- Move completed user-visible work into `CHANGELOG.md`.
- Remove stale commitments.
- Promote only the next reviewable set of work into `Now`.
