# Changelog

## 0.4.2

- Update Markdown and CSS lint tooling and the TypeScript ESLint integration.
- Pin CI and release builds to Node.js 24.22.3.

## 0.4.1

- Keep the same text selected when switching between Markdown and Unicode.
- Preserve literal punctuation, link text, and list markers during formatting.
- Show the correct toolbar state for a fully styled draft.
- Refresh the documentation and add Mermaid C4 architecture diagrams.

## 0.4.0

- Format eligible text across a whole draft and preserve protected Markdown
  syntax. Toggle selected random lettering back to plain Latin.
- Put Help and Clear draft next to the editor and make warnings more visible.
- Speed up whole-draft formatting and Unicode conversion. Add a shared
  performance gate that checks both timing and results on long drafts.

## 0.3.3

- Continue armed Bold inside nested Markdown formatting and at the start of
  an existing bold span without inserting extra delimiters.
- Verify both scenarios through browser typing and Markdown-to-Unicode
  conversion.

## 0.3.2

- Preserve nearby Markdown styling when typing with an armed format. Keep
  punctuation-only spans editable and move outside them when formatting ends.
- Keep styled flags, skin-tone emoji, and CRLF together in the fallback
  grapheme segmenter.
- Extend regression tests for editing, undo grouping, and caret mapping.

## 0.3.1

- Added regression coverage for projected editing, Markdown, Unicode, and
  writing analysis. Raised the overall mutation score gate to 80%.

## 0.3.0

- Added Random font in Unicode mode and a Bavarian blue-and-white theme.
- Moved the open editor overview above the draft.
- Recorded the additional requirements and acceptance checks.

## 0.2.2

- Fixed single-tilde toggling, unfinished typing spans, and fence warnings.
- Added the product vision to the Markdown lint gate and documented ShellCheck.
- Added coverage, mutation, and code history charts to the README.

## 0.2.1

- Switched the Unicode editor font so short strikes overlay their letters.

## 0.2.0

- Added three Unicode underline and three strikethrough choices.
- Added the author, source repository, test results, and a short editor overview.

## 0.1.8

- Updated the Markdown linter’s KaTeX dependency to clear the npm audit.

## 0.1.7

- Confirmed GPL v3 or later and corrected the author credit.
- Made the local pipeline install dependencies from a fresh checkout.

## 0.1.6

- Organized project documents and tool configuration into dedicated folders.
- Made the author byline and GitHub Pages link easier to find in the README.

## 0.1.5

- Added GitHub Actions dry runs for Pages artifacts and release packages.
- Made release archives reproducible and verified existing assets on reruns.

## 0.1.4

- Improved round-trips after edits, code protection, and unordered bullets.
- Made expanded help hoverable and kept diagnostic jumps aligned with the gutter.
- Packaged the full application and dependency licenses in the static build.

## 0.1.3

- Run browser checks as the Playwright image user on GitHub-hosted runners.

## 0.1.2

- Enforced 98% application line coverage with unit and browser instrumentation.
- Added isolated mutation testing and expanded browser regression tests.

## 0.1.1

- Added GitHub Actions verification, Pages deployment and tagged release builds.

## 0.1.0

- Added one local editor with reversible Markdown and Unicode views, formatting
  tools and editing history.
- Added output selection, clipboard copy, text export and writing assistance.
- Added English and German, light and dark modes, and staged contextual help.
