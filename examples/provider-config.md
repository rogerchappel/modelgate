# Provider fixture shape

`modelgate` reads two JSON files from a directory. Keep them redacted and commit-safe.

- `providers.json` lists providers, their documented environment variable names, and model prices.
- `routes.json` lists primary models, fallbacks, budget hints, and tag requirements.
- Provider, model, model `cost`, and route objects reject unknown keys and report the exact indexed path.

See [`../fixtures/sample`](../fixtures/sample) for a complete local smoke fixture.
