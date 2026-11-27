# Requirements and checks

<!-- markdownlint-configure-file { "MD013": { "tables": false } } -->

The [product vision](../vision.md) is the full brief. This page lists the main
checks for the editor and its delivery workflow.

## Editor and presentation

| Requirement | Acceptance evidence |
| --- | --- |
| One private browser editor for Markdown and copyable Unicode | Switch modes, copy exact Unicode, and export UTF-8 in browser tests. |
| Six Unicode line styles | Check all six marks, styled spaces, removal, pasted variants, and unchanged round-trips. |
| Random font in Unicode mode | Test predictable glyph choices, undo, formatting as you type, code protection, combining marks, and Markdown round-trips. |
| Whole-draft formatting and reversible Random font | Select a multiline draft with code and links. Apply Bold or Random font, then click again to restore eligible text. |
| Visible editor actions and warnings | Find Help and Clear draft next to the editor. Verify that skipped Markdown syntax is explained beside the draft. |
| Local draft saving | With saving on by default, reopen the URL in a new tab and verify the exact draft and mode. Turn saving off and verify later visits stay blank. Clear the draft and verify the saved copy is removed. |
| Light, Dark, System, and Bavarian | Change the theme in browser tests and check Bavarian contrast with axe. |
| English, German, and tooltips | Switch languages and check that short hints expand after four seconds. |
| Overview before the editor | Verify the introduction is open by default and above the draft with a paragraph and three bullets explaining LinkedIn and plain-text email use. |
| Visible project, author, and test links | Check the links to GitHub, the CI workflow, and Marcel Petrick's email. |

## Repository and delivery

| Requirement | Acceptance evidence |
| --- | --- |
| Organized repository and a shared plan | Keep support files in dedicated folders and record changes in [PLAN.md](PLAN.md). |
| Author and license credit | The README credits Marcel Petrick with his email, states GPL-3.0-or-later, and discloses AI assistance. |
| README links and history charts | Check links and build the charts from Git and [recorded CI samples](coverage-history.csv). |
| GitHub About is concise and discoverable | Check the live repository description, homepage, and ten topics. |
| Fresh-checkout verification | Run the shared pipeline from a clone without npm dependencies or output. Lint all tracked Markdown and check the shell entry point with ShellCheck. |
| 100% application line, statement, branch, and function coverage and 80% overall mutation score | Merge browser and unit coverage and run mutation analysis in an isolated sandbox. CI publishes the reports. |
| Long drafts stay responsive | Run [the performance checks](PERFORMANCE.md) in the local pipeline and CI. |
| Exact supported npm pins | Compare the registry, lockfile, and dependency inventory. Run the audit and full gate for package changes. |
| GitHub Pages and a separate release pipeline | Check the Pages deployment at its public subpath and verify the release archive and SHA-256 checksum. |

Run `./localPipeline.sh` for the local checks and `npm run mutation` for mutation
testing. The
[GitHub CI workflow](https://github.com/marcelpetrick/Boldemort/actions/workflows/ci.yml)
links to verification reports for each published commit.
