import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const expected = {
  name: 'modelgate-cli',
  bin: './dist/src/cli.js',
  repository: 'git+https://github.com/rogerchappel/modelgate.git'
};
const workflow = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const requiredWorkflowFragments = [
  'id-token: write',
  'registry-url: https://registry.npmjs.org',
  'npm publish "${{ steps.pack.outputs.package_file }}" --provenance --access public',
  'gh release create "${GITHUB_REF_NAME}" --notes-file RELEASE_NOTES.md "${{ steps.pack.outputs.package_file }}"'
];

for (const fragment of requiredWorkflowFragments) {
  if (!workflow.includes(fragment)) throw new Error(`release workflow is missing: ${fragment}`);
}

const directory = mkdtempSync(join(tmpdir(), 'modelgate-release-contract-'));
try {
  const packed = spawnSync('npm', ['pack', '--json', '--pack-destination', directory], { encoding: 'utf8' });
  if (packed.status !== 0) throw new Error(`${packed.stdout}\n${packed.stderr}`);
  const filename = JSON.parse(packed.stdout)[0].filename;
  const sourceManifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const expectedFilename = `${sourceManifest.name}-${sourceManifest.version}.tgz`;
  if (filename !== expectedFilename) {
    throw new Error(`packed filename must be ${expectedFilename}, received ${filename}`);
  }
  const extracted = spawnSync('tar', ['-xOf', join(directory, filename), 'package/package.json'], { encoding: 'utf8' });
  if (extracted.status !== 0) throw new Error(extracted.stderr);
  const manifest = JSON.parse(extracted.stdout);
  if (manifest.name !== expected.name) throw new Error(`packed name must be ${expected.name}`);
  if (manifest.bin?.modelgate !== expected.bin) throw new Error('packed modelgate CLI mapping drifted');
  if (manifest.repository?.url !== expected.repository) throw new Error('packed repository identity drifted');
} finally {
  rmSync(directory, { recursive: true, force: true });
}

console.log('release package and trusted-publishing contract passed');
