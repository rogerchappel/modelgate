# CI Example

A minimal CI job can inspect checked-in redacted fixtures without provider credentials:

```yaml
- run: npm ci
- run: npm run build
- run: node dist/src/cli.js inspect fixtures/sample --format json --output out/modelgate.json
```

Treat exit code `2` as a policy failure if your route review should block merges.
