import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const metadata = JSON.parse(await readFile('package.json', 'utf8'));
const tag = process.argv[2];
if (!/^v\d+\.\d+\.\d+$/u.test(tag ?? '') || tag !== 'v' + metadata.version) {
  throw new Error('Release tag must match the package version.');
}
const changelog = await readFile('CHANGELOG.md', 'utf8');
if (!changelog.split('\n').includes('## ' + metadata.version)) {
  throw new Error('The release needs a matching changelog entry.');
}
await mkdir('release', { recursive: true });
await cp('DEPENDENCIES.md', 'dist/DEPENDENCIES.md');
const filename = 'Boldemort-' + tag + '.tar.gz';
execFileSync('tar', ['-czf', 'release/' + filename, '-C', 'dist', '.']);
const buffer = await readFile('release/' + filename);
await writeFile(
  'release/' + filename + '.sha256',
  createHash('sha256').update(buffer).digest('hex') + '  ' + filename + '\n',
);
