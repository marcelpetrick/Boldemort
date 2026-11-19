# Long-draft profiling

The benchmark uses 200–240 paragraphs (about 17,000–18,000 source characters)
and checks the resulting text or statistics outside the timed interval. It
covers plain and styled Unicode, Markdown with inline code and a link, and
writing analysis.

| Workload | Before | After | CI budget |
| --- | ---: | ---: | ---: |
| Unicode Bold over the whole draft | 59.6 ms | 9.8 ms | 70 ms |
| Random font state and restore | 61.4 ms | 8.9 ms | 80 ms |
| Markdown Bold across a mixed draft | 23.6 ms | 22.7 ms | 150 ms |
| Styled Unicode to Markdown | 21.0 ms | 14.8 ms | 110 ms |
| Writing analysis of styled Unicode | 21.8 ms | 21.6 ms | 110 ms |

These are medians from sequential 15-sample runs on the same local Linux
machine with Node 24.20.0. The baseline is commit `b4e2999`. The figures are
core operation times and can vary with machine load. The Markdown formatting
and analysis runs stayed close to their baseline in this comparison.

The CPU profile identified four sources of avoidable work.

- **Markdown parsing in plain selections.** Skip parsing in Unicode mode
  when the draft has none of the markers for protected Markdown. Keep parsing
  for code, links, HTML and other constructs, including bare web and email
  autolinks.
- **Grapheme scans for selection edges.** A whole draft already starts and
  ends on grapheme boundaries, so format it without a separate boundary scan.
- **Random font membership and state.** Index the random alphabet and check
  the selection state incrementally.
- **Repeated Unicode decoding.** Reuse glyph state within formatting, skip
  combining-mark work for single-code-point segments, and inspect each
  conversion lookahead once per group of spaces.

Run `npm run performance` for the guard used by `localPipeline.sh`, including
GitHub Actions. It warms each operation twice and fails when the median of five
runs exceeds a budget. The budgets allow for shared runner variability. To
collect a local CPU profile and a longer timing series, run:

```sh
node --cpu-prof --cpu-prof-dir=/tmp scripts/performance.mjs --profile
```
