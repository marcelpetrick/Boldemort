# Additional requirements

<!-- markdownlint-configure-file { "MD013": { "tables": false } } -->

[vision.md](../vision.md) is the full product specification. This page collects
the requirements added during implementation and the checks that substantiate
them.

## Editor and presentation

| Requirement | Acceptance evidence |
| --- | --- |
| One private browser editor for Markdown and copyable Unicode | Switch modes, copy exact Unicode, and export UTF-8 in browser tests. |
| Line styles based on published Unicode examples | Check all six exact marks, styled spaces, toggle-off, older variants, and unchanged round-trips. |
| Random font in Unicode mode | Test exact seeded glyphs, code protection, undo, armed typing, preserved text and combining marks, and Markdown round-trips. |
| Whole-draft formatting and reversible Random font | Use Ctrl+A on multiline drafts with code and links, apply Bold and Random font, and verify a second click restores plain text where eligible. |
| Visible editor actions and warnings | Find Help and Clear draft next to the editor. Verify that skipped Markdown syntax is explained beside the draft. |
| Light, Dark, System, and Bavarian | Change the theme in browser tests and check Bavarian contrast with axe. |
| English and German and staged tooltips | Check language switching and the transition from brief help to expanded help at four seconds. |
| Overview before the editor | Verify the introduction is open by default and above the draft with a paragraph and three bullets explaining LinkedIn and plain-text email use. |
| Visible project, author, and evidence links | Verify the editor links to GitHub, the CI workflow, and Marcel Petrick's email. |

## Repository and delivery

| Requirement | Acceptance evidence |
| --- | --- |
| Lean repository root and iterative planning | Support files live in dedicated folders and changes are recorded in [PLAN.md](PLAN.md). |
| Author and license like Cullendula | README credits Marcel Petrick with his email, states GPL-3.0-or-later, and discloses AI assistance. |
| README badges, tryout, and two history charts | Check link targets and regenerate both charts from Git and [recorded CI samples](coverage-history.csv). |
| GitHub About is concise and discoverable | Check the live repository description, homepage, and ten topics. |
| Fresh-checkout verification | Run the shared pipeline from a clone without npm dependencies or output. Lint all tracked Markdown and check the shell entry point with ShellCheck. |
| At least 98% application line coverage and 80% overall mutation score | Merge browser and unit coverage and run mutation analysis in an isolated sandbox. CI publishes the reports. |
| Exact supported npm pins | Compare the registry, lockfile, and dependency inventory. Run the audit and full gate for package changes. |
| GitHub Pages and a separate release pipeline | Check the Pages deployment at its public subpath and verify the release archive and SHA-256 checksum. |

Run `./localPipeline.sh` for the local gate and `npm run mutation` for the
isolated mutation run. The
[GitHub CI workflow](https://github.com/marcelpetrick/Boldemort/actions/workflows/ci.yml)
links to verification reports for each published commit.
