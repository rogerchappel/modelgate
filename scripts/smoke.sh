#!/usr/bin/env bash
set -euo pipefail
rm -rf out
node dist/src/cli.js inspect fixtures/sample --format json --output out/report.json
node -e 'const r=require("node:fs").readFileSync("out/report.json","utf8"); const j=JSON.parse(r); if (j.summary.routes !== 2 || j.summary.errors !== 0) process.exit(1); console.log("smoke ok: inspected", j.summary.routes, "routes");'
node dist/src/cli.js inspect fixtures/sample --format markdown > out/report.md
