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
// Every application module must cover all of its lines, statements,
// branches, and functions, whether unit or browser tests exercise it.
const metrics = ['lines', 'statements', 'branches', 'functions'];
const sources = new Map();
for (const [file, summary] of Object.entries(unit)) {
  if (file.endsWith('.ts')) sources.set(file.split('/').at(-1), summary);
}
for (const file of browser.files()) {
  const fileCoverage = browser.fileCoverageFor(file);
  const name = file.split('/').at(-1);
  if (sources.has(name)) throw new Error('Overlapping coverage for ' + file);
  sources.set(name, fileCoverage.toSummary().data);
  const missed = fileCoverage.getUncoveredLines();
  if (missed.length)
    process.stdout.write(name + ' uncovered lines ' + missed.join(', ') + '\n');
  const branches = fileCoverage.getBranchCoverageByLine();
  const partial = Object.entries(branches)
    .filter(([, entry]) => entry.coverage < 100)
    .map(([line]) => line);
  if (partial.length)
    process.stdout.write(
      name + ' partial branches on lines ' + partial.join(', ') + '\n',
    );
}
const totals = Object.fromEntries(
  metrics.map((metric) => [metric, { covered: 0, total: 0 }]),
);
for (const name of (await readdir('src'))
  .filter((item) => item.endsWith('.ts'))
  .sort()) {
  const entry = sources.get(name);
  if (!entry) throw new Error('Missing coverage for ' + name);
  for (const metric of metrics) {
    totals[metric].covered += entry[metric].covered;
    totals[metric].total += entry[metric].total;
  }
  process.stdout.write(
    name +
      ' ' +
      metrics
        .map((metric) => entry[metric].covered + '/' + entry[metric].total)
        .join(' ') +
      ' lines statements branches functions\n',
  );
}
let complete = true;
for (const metric of metrics) {
  const { covered, total } = totals[metric];
  const percentage = total ? (100 * covered) / total : 100;
  complete &&= covered === total;
  process.stdout.write(
    'Application ' +
      metric +
      ' coverage ' +
      percentage.toFixed(2) +
      '% (' +
      covered +
      '/' +
      total +
      ')\n',
  );
}
if (!complete) throw new Error('Application coverage must be 100%.');
