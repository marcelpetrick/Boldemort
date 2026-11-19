# Boldemort implementation plan

1. Canonicalize the supplied vision and capture provisional decisions.
2. Build and test a single textarea, Unicode styling, source-positioned GFM
   conversion, reversible mode switches, history and armed formatting.
3. Add clipboard and export, writing metrics, LinkedIn guidance and diagnostics.
4. Implement a compact responsive UI with light, dark and system themes,
   English and German, and short help that expands after four seconds.
5. Exercise keyboard, composition, conversions, files, clipboard,
   accessibility, narrow screens and the GitHub Pages subpath.
6. Run static checks, tests and coverage, review for data loss and UX friction,
   capture a screenshot, and document usage and dependencies.
7. Commit and push, then verify GitHub Actions and the published Pages site.

## Progress

- Vision intake complete. Both input files matched byte for byte. The root
  `vision.md` is the canonical copy.
- Editor first pass complete. The browser workflow is running on Chromium and
  Firefox. Next, wire the release checks and strengthen coverage across the
  whole editor.
- Local pipeline passed with Chromium, Firefox and WebKit. Added Actions
  verification, Pages publication and checksum-backed releases from SemVer tags.
- Added a 98% combined line coverage gate for every application module and
  sandboxed mutation testing for conversion, editing, and writing analysis.
  Regression tests exercise offline use, long drafts, and clipboard fallback.
- The first remote mutation job passed. Fixed the Firefox launch environment
  for the browser job by matching the GitHub runner's user inside the container.
- Self-review tightened source-aware round-trips, preserved literal code and
  task markers, and verified simple bullet conversion. Added scroll-aware
  diagnostics, hoverable long help, and bundled license notices.
- Verified an article-length paste and follow-up edit in all three browsers.
  Added release and Pages artifact dry runs while awaiting license confirmation.
- Moved supporting docs into `docs/` and tool configuration into `config/`.
  Updated all pipeline and release paths. Added the author and Pages link
  near the top of the README and reviewed the reorganization against main.
- Confirmed GPL-3.0-or-later and corrected the author credit to Marcel Petrick.
  Added clean-checkout installation to the shared verification pipeline before
  enabling public Pages deployment.
- Reviewed exact npm pins against the registry. Updated KaTeX from 0.16.47 to
  0.19.1 to clear the audit. Kept TypeScript at 6.0.3, the latest stable version
  supported by the TypeScript ESLint peer range.
- Verified YayText’s published Unicode line mappings and recorded defaults,
  alternatives, and round-trip acceptance in the vision. Verify exact
  clipboard bytes, pasted variants, and the editor’s help and project links
  before publishing to GitHub Pages.
- Compared fonts against the actual Unicode output. Use the system UI font
  in Unicode mode so stroke overlays render through letters. Test the font
  switch and retain monospace in Markdown mode.
- Reviewed published main and all tracked Markdown. Fixed Markdown edge
  cases, ran ShellCheck directly, and added the vision to the lint gate.
- Added two README charts from historical CI measurements and Git revisions.
- Added Random font, the Bavarian theme, and an open overview above the draft.
  Verify glyph preservation, selection undo, typing toggle, theme accessibility,
  and localized labels before publishing.
- Reviewed surviving mutants from the 72.59% baseline. Added regression tests
  for externally observable editing, conversion, and analysis behavior. Keep
  the same mutation scope and enforce an 80% overall minimum.
- From the 85.62% baseline, reproduce and fix armed typing beside other
  Markdown styles and Unicode line styling without `Intl.Segmenter`.
  Verify compatible typing continuation, styled emoji round-trips, and undo
  before rerunning mutation and the release checks.
- Reproduce the v0.3.2 review findings in browser tests before changing the
  editor. Verify armed Bold at a nested closing delimiter and immediately
  before a bold opener in both Markdown and Unicode. Preserve the previous
  bold-italic and punctuation checks, then run the release gates.
- Verify Ctrl+A formatting on multiline drafts with protected syntax. Apply
  formatting to eligible text in one action and make Random font toggle
  selected lettering back to Latin while preserving Unicode line marks.
- Move Help and Clear draft to the editor controls. Make warnings and errors
  easier to notice and act on in both languages. Verify the placement and
  message states in browser tests, review the changes, then record a short
  editor demonstration under `media/` and publish the verified build.
- Profile long-draft selection, formatting, conversion, and analysis on a
  production-equivalent workload. Record up to five measured bottlenecks,
  verify fixes against the same corpus, and run a timing guard in the shared
  local and CI pipeline.
- Compare long-draft operations against the v0.4.0 profile. Keep formatting
  and syntax-protection assertions in the benchmark as timing improves.
- Record the Markdown-to-Unicode and reversible Random font workflows as two
  6.8-second LinkedIn GIFs. Check the rendered frames and file limits, and
  link the [storyboards](DEMO.md) and recordings from the README.
- Final review reproduced a protection gap for numbered lists and code
  indented with mixed whitespace. Keep those constructs protected on the
  Unicode fast path and verify both list delimiters and indentation.
- Verify that Bold shows its pressed state after formatting a mixed
  selection, using the same eligible characters as the toggle itself.
