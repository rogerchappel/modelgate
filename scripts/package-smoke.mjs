import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const packageName = 'modelgate-cli';
const directory = mkdtempSync(join(tmpdir(), 'modelgate-package-smoke-'));
const result = spawnSync('npm', ['pack', '--json', '--pack-destination', directory], { encoding: 'utf8' });
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
  'SKILL.md',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md'
];

const packed = JSON.parse(result.stdout)[0];
const entries = packed.files.map(({ path }) => path);
const missing = required.filter((entry) => !entries.includes(entry));
if (missing.length > 0) {
  console.error(`package smoke missing entries:\n${missing.join('\n')}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
if (manifest.name !== packageName || manifest.bin?.modelgate !== './dist/src/cli.js') {
  throw new Error('packed manifest identity or modelgate binary is inconsistent');
}

const tarball = join(directory, packed.filename);
const installDirectory = join(directory, 'install');
const install = spawnSync('npm', ['install', '--ignore-scripts', '--prefix', installDirectory, tarball], { encoding: 'utf8' });
if (install.status !== 0) {
  process.stderr.write(`${install.stdout}\n${install.stderr}`);
  process.exit(install.status || 1);
}

writeFileSync(join(installDirectory, 'smoke.mjs'), `import { inspectWorkspace } from '${packageName}'; if (typeof inspectWorkspace !== 'function') process.exit(1);`);
const imported = spawnSync('node', ['smoke.mjs'], {
  cwd: installDirectory,
  encoding: 'utf8'
});
const cli = spawnSync(join(installDirectory, 'node_modules', '.bin', 'modelgate'), ['--version'], { encoding: 'utf8' });
rmSync(directory, { recursive: true, force: true });

if (imported.status !== 0 || cli.status !== 0 || cli.stdout.trim() !== manifest.version) {
  process.stderr.write(`${imported.stderr}${cli.stderr}`);
  throw new Error('installed package import or CLI smoke failed');
}

console.log(`package smoke passed for ${packageName}@${manifest.version}`);
