// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { analyze } from '../src/analysis.ts';
import { formatSelection, selectionFormatting } from '../src/document.ts';
import { convert } from '../src/markdown.ts';
import { randomizeUnicode, styleUnicode } from '../src/unicode.ts';

const plain =
  'One draft, two formats. Keep the examples concise and the links intact.\n\n'.repeat(
    240,
  );
const mixed =
  'Share **the update**. Read [the notes](https://example.com) and keep `const x` unchanged.\n\n'.repeat(
    200,
  );
const bold = styleUnicode(plain, ['bold']);
const randomized = randomizeUnicode(plain, () => 0);
const fullSelection = (text, mode = 'unicode') => ({
  text,
  mode,
  start: 0,
  end: text.length,
});
const samples = [
  {
    name: 'Unicode Bold on a full selection',
    budget: 70,
    run: () => formatSelection(fullSelection(plain), 'bold')?.value,
    check: (result) => assert.equal(result, bold),
  },
  {
    name: 'Random font state and restore on a full selection',
    budget: 80,
    run: () => {
      const frame = fullSelection(randomized);
      return [
        selectionFormatting(frame).random,
        formatSelection(frame, 'random')?.value,
      ];
    },
    check: (result) => assert.deepEqual(result, [true, plain]),
  },
  {
    name: 'Markdown Bold across a mixed draft',
    budget: 150,
    run: () => formatSelection(fullSelection(mixed, 'markdown'), 'bold')?.value,
    check: (result) =>
      assert.match(
        result,
        /\*\*Share\*\* \*\*the update\. Read\*\* \[the notes\]\(https:\/\/example\.com\).*`const x`/u,
      ),
  },
  {
    name: 'Styled Unicode to Markdown conversion',
    budget: 110,
    run: () => convert(bold, 'unicode'),
    check: (result) => assert.match(result, /^\*\*One draft/u),
  },
  {
    name: 'Writing analysis of styled Unicode',
    budget: 110,
    run: () => analyze(bold, 'en'),
    check: (result) => assert.equal(result.paragraphs, 240),
  },
];

const profiling = process.argv.includes('--profile');
const iterations = profiling ? 15 : 5;
for (const { name, budget, run, check } of samples) {
  check(run());
  check(run());
  const timings = [];
  for (let count = 0; count < iterations; count++) {
    const start = performance.now();
    const result = run();
    timings.push(performance.now() - start);
    check(result);
  }
  timings.sort((a, b) => a - b);
  const median = timings[Math.floor(timings.length / 2)];
  process.stdout.write(
    `${name}: ${median.toFixed(1)} ms median (limit ${budget} ms)\n`,
  );
  if (median > budget && !profiling) process.exitCode = 1;
}
