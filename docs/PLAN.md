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
