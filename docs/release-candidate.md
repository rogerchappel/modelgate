# Release candidate readiness

Status: **READY**

Generated: 2026-05-05 21:26:12 UTC

## Scope

Release-candidate readiness pass for `rogerchappel/modelgate` against `origin/main`.

## Local verification

- npm ci:pass
- release:check:pass
- validate.sh:pass
- releasebox:pass

## Blockers

- None found in local readiness gates.

## ReleaseBox check / command log

```text
\n===== npm ci =====
+ npm ci --prefix /Users/roger/Developer/my-opensource/_worktrees/modelgate-release-candidate-readiness

added 3 packages, and audited 4 packages in 497ms

found 0 vulnerabilities
EXIT_CODE=0
\n===== npm run release:check =====
+ npm --prefix /Users/roger/Developer/my-opensource/_worktrees/modelgate-release-candidate-readiness run release:check

> modelgate@0.1.0 release:check
> npm run check && npm test && npm run smoke && npm pack --dry-run


> modelgate@0.1.0 check
> tsc -p tsconfig.json --noEmit


> modelgate@0.1.0 test
> npm run build && node --test dist/tests/**/*.test.js


> modelgate@0.1.0 build
> tsc -p tsconfig.json

✔ broken fixture produces actionable errors and warnings (6.479042ms)
✔ parseArgs supports inspect json output (1.186084ms)
✔ parseArgs rejects unknown flags (0.179209ms)
✔ roundUsd keeps four decimal places (1.248833ms)
✔ estimateModelUsd combines input and output token prices (0.167042ms)
✔ formats report as markdown and json (3.982083ms)
✔ fixture inspection summarizes routes and non-fatal findings (8.285625ms)
✔ missing primary is reported as an error (0.251125ms)
✔ loadWorkspace reads provider and route fixture files (5.976042ms)
✔ validateWorkspace rejects malformed provider shape (0.545833ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 120.871042

> modelgate@0.1.0 smoke
> npm run build && bash scripts/smoke.sh


> modelgate@0.1.0 build
> tsc -p tsconfig.json

smoke ok: inspected 2 routes
npm notice
npm notice package: modelgate@0.1.0
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 3.1kB README.md
npm notice 387B dist/src/cli.d.ts
npm notice 454B dist/src/cli.d.ts.map
npm notice 3.8kB dist/src/cli.js
npm notice 3.8kB dist/src/cli.js.map
npm notice 251B dist/src/cost.d.ts
npm notice 298B dist/src/cost.d.ts.map
npm notice 392B dist/src/cost.js
npm notice 515B dist/src/cost.js.map
npm notice 260B dist/src/errors.d.ts
npm notice 252B dist/src/errors.d.ts.map
npm notice 397B dist/src/errors.js
npm notice 425B dist/src/errors.js.map
npm notice 232B dist/src/format.d.ts
npm notice 267B dist/src/format.d.ts.map
npm notice 1.4kB dist/src/format.js
npm notice 1.4kB dist/src/format.js.map
npm notice 369B dist/src/index.d.ts
npm notice 389B dist/src/index.d.ts.map
npm notice 334B dist/src/index.js
npm notice 364B dist/src/index.js.map
npm notice 340B dist/src/inspect.d.ts
npm notice 345B dist/src/inspect.d.ts.map
npm notice 5.4kB dist/src/inspect.js
npm notice 5.9kB dist/src/inspect.js.map
npm notice 255B dist/src/parser.d.ts
npm notice 280B dist/src/parser.d.ts.map
npm notice 2.5kB dist/src/parser.js
npm notice 2.6kB dist/src/parser.js.map
npm notice 1.9kB dist/src/types.d.ts
npm notice 2.0kB dist/src/types.d.ts.map
npm notice 44B dist/src/types.js
npm notice 105B dist/src/types.js.map
npm notice 327B examples/ci.md
npm notice 382B examples/provider-config.md
npm notice 1.0kB fixtures/sample/providers.json
npm notice 514B fixtures/sample/routes.json
npm notice 1.5kB package.json
npm notice Tarball Details
npm notice name: modelgate
npm notice version: 0.1.0
npm notice filename: modelgate-0.1.0.tgz
npm notice package size: 12.8 kB
npm notice unpacked size: 45.6 kB
npm notice shasum: 1fe3ecd25efef513fb1157df0179c7cdebc0d930
npm notice integrity: sha512-NoXdBXcynQpfy[...]P1rCXhUlDD7uA==
npm notice total files: 39
npm notice
modelgate-0.1.0.tgz
EXIT_CODE=0
\n===== bash scripts/validate.sh =====
+ bash -lc cd '/Users/roger/Developer/my-opensource/_worktrees/modelgate-release-candidate-readiness' && bash scripts/validate.sh
Checking modelgate required files...
PASS: required file exists: README.md
PASS: required file exists: AGENTS.md
PASS: required file exists: CONTRIBUTING.md
PASS: required file exists: SECURITY.md
PASS: required file exists: .github/pull_request_template.md
PASS: required file exists: scripts/validate.sh

Checking modelgate required directories...
PASS: required directory exists: .github
PASS: required directory exists: docs
PASS: required directory exists: scripts

Running local project checks where present...
NOTE: using package manager: npm

> modelgate@0.1.0 check
> tsc -p tsconfig.json --noEmit

PASS: package script: check

> modelgate@0.1.0 test
> npm run build && node --test dist/tests/**/*.test.js


> modelgate@0.1.0 build
> tsc -p tsconfig.json

✔ broken fixture produces actionable errors and warnings (7.869666ms)
✔ parseArgs supports inspect json output (1.328333ms)
✔ parseArgs rejects unknown flags (0.570833ms)
✔ roundUsd keeps four decimal places (0.828334ms)
✔ estimateModelUsd combines input and output token prices (0.072167ms)
✔ formats report as markdown and json (6.662292ms)
✔ fixture inspection summarizes routes and non-fatal findings (6.574083ms)
✔ missing primary is reported as an error (0.295875ms)
✔ loadWorkspace reads provider and route fixture files (5.354875ms)
✔ validateWorkspace rejects malformed provider shape (0.282125ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 111.631625
PASS: package script: test

> modelgate@0.1.0 build
> tsc -p tsconfig.json

PASS: package script: build
NOTE: agent-qc not installed; skipping optional agent check

Validation passed.
EXIT_CODE=0
\n===== releasebox check =====
+ node /Users/roger/Developer/my-opensource/releasebox/bin/releasebox.js check /Users/roger/Developer/my-opensource/_worktrees/modelgate-release-candidate-readiness
✅ releasebox config: node-cli
✅ ci workflow: .github/workflows/ci.yml
✅ release dry run workflow: .github/workflows/release-dry-run.yml
✅ task breakdown: docs/TASKS.md
✅ orchestration plan: docs/ORCHESTRATION.md
✅ dependabot config: .github/dependabot.yml
✅ npm test script: npm run build && node --test dist/tests/**/*.test.js
✅ build script: tsc -p tsconfig.json
✅ smoke script: npm run build && bash scripts/smoke.sh
✅ bin entry: {"modelgate":"./dist/src/cli.js"}
EXIT_CODE=0
```
