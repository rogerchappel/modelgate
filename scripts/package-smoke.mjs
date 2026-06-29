import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['pack', '--dry-run'], { encoding: 'utf8' });
const output = `${result.stdout || ''}\n${result.stderr || ''}`;

if (result.status !== 0) {
  process.stderr.write(output);
  process.exit(result.status || 1);
}

const required = [
  'dist/src/cli.js',
  'dist/src/index.js',
  'dist/src/index.d.ts',
  'examples/provider-config.md',
  'fixtures/sample/providers.json',
  'fixtures/sample/routes.json',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md'
];

const missing = required.filter((entry) => !output.includes(entry));
if (missing.length > 0) {
  console.error(`package smoke missing entries:\n${missing.join('\n')}`);
  process.exit(1);
}

console.log('package smoke passed');
