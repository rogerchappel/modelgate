# Safety Notes

`modelgate` is built for pre-flight review, not request execution.

Safe-by-default choices:

- No provider SDKs or API clients are included.
- No network access is needed for inspection.
- Fixtures should be redacted and commit-safe.
- Reports are deterministic for CI and agent review.
- Configuration errors return a distinct exit code (`2`) so automation can decide whether to block.

Do not put secrets in fixture files. If you need to document credential requirements, use environment variable names only.
