import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const expectedName = 'modelgate-cli';
const expectedRepository = 'https://github.com/rogerchappel/modelgate';
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');

if (manifest.name !== expectedName) {
  throw new Error(`package name must be ${expectedName}, received ${manifest.name}`);
}

for (const command of [`npm install ${expectedName}`, `from "${expectedName}"`]) {
  if (!readme.includes(command)) {
    throw new Error(`README is missing package identity reference: ${command}`);
  }
}

const lookup = spawnSync('npm', ['view', expectedName, 'name', 'repository.url', '--json'], {
  encoding: 'utf8'
});

if (lookup.status === 0) {
  const published = JSON.parse(lookup.stdout);
  const repository = typeof published.repository === 'string'
    ? published.repository
    : published.repository?.url;
  const normalized = repository?.replace(/^git\+/, '').replace(/\.git$/, '');
  if (published.name !== expectedName || normalized !== expectedRepository) {
    throw new Error(`${expectedName} is published by a different repository`);
  }
} else if (!lookup.stderr.includes('E404')) {
  process.stderr.write(lookup.stderr);
  throw new Error(`could not verify npm availability for ${expectedName}`);
}

console.log(`${expectedName} identity is available or owned by this repository`);
