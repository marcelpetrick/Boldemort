import { readdir, readFile } from 'node:fs/promises';
import process from 'node:process';
import coverage from 'istanbul-lib-coverage';
import sourceMaps from 'istanbul-lib-source-maps';

const root = 'test-results/coverage';
const parts = (await readdir(root, { recursive: true })).filter((path) =>
  path.endsWith('/istanbul.json'),
);
if (!parts.length) throw new Error('No browser coverage was collected.');
const raw = coverage.createCoverageMap({});
for (const part of parts)
  raw.merge(JSON.parse(await readFile(root + '/' + part, 'utf8')));
const browser = await sourceMaps.createSourceMapStore().transformCoverage(raw);
const unit = JSON.parse(
  await readFile('coverage/coverage-summary.json', 'utf8'),
);
const sources = new Map();
for (const [file, summary] of Object.entries(unit)) {
  if (file.endsWith('.ts')) sources.set(file.split('/').at(-1), summary.lines);
}
for (const file of browser.files()) {
  const fileCoverage = browser.fileCoverageFor(file);
  const name = file.split('/').at(-1);
  if (sources.has(name)) throw new Error('Overlapping coverage for ' + file);
  sources.set(name, fileCoverage.toSummary().lines);
  const missed = fileCoverage.getUncoveredLines();
  if (missed.length)
    process.stdout.write(name + ' uncovered lines ' + missed.join(', ') + '\n');
}
let covered = 0;
let total = 0;
for (const name of (await readdir('src'))
  .filter((item) => item.endsWith('.ts'))
  .sort()) {
  const entry = sources.get(name);
  if (!entry) throw new Error('Missing coverage for ' + name);
  covered += entry.covered;
  total += entry.total;
  process.stdout.write(
    name + ' ' + entry.covered + '/' + entry.total + ' lines\n',
  );
}
const percentage = (100 * covered) / total;
process.stdout.write(
  'Application line coverage ' +
    percentage.toFixed(2) +
    '% (' +
    covered +
    '/' +
    total +
    ')\n',
);
if (percentage < 98)
  throw new Error('Application line coverage must be at least 98%.');
