# Boldemort repository instructions

## Start here

1. Read `vision.md`, the canonical product brief.
2. Read [PLAN.md](PLAN.md), [DECISIONS.md](DECISIONS.md), and [README.md](README.md).
3. Update the plan with acceptance scenarios and ordered deliverables before
   changing product code. Wait for the vision before starting implementation.
   Raise material conflicts between the vision and existing project decisions.

## Implement and verify

- Deliver small, coherent increments through the product's normal entry points.
  Keep the plan and decision record current as evidence changes the approach.
- Make `localPipeline.sh` the shared entry point for local and CI verification.
  Include applicable format, lint, static analysis, test, coverage, and build
  checks. Add end-to-end and container checks as those entry points become
  available. Enforce at least 98% combined application line coverage across
  unit-tested and browser-tested modules. Run mutation tests in a sandbox.
- Follow the repository's integration branch. DarkFactory defaults to `main`
  for an empty repository. Verify each atomic change before committing, use
  Conventional Commits, and push verified commits when authorized. Once the
  version is established, use SemVer with patch bumps for routine changes and
  minor bumps for significant compatible features.
- Document runnable commands in the README. Include a real screenshot if the
  product has a UI. Keep credentials and private data out of commits.
- Follow the repository's GPLv3 license and use appropriate source headers.

## Review and finish

- Review the diff and exercise acceptance scenarios before calling a change
  complete. Verify findings against the code or test output, fix them, and
  rerun affected checks. Use `reviewBranch` for the final implementation review
  and `githubAbout` for final repository metadata where available.
- Run the full pipeline at handoff. Verify CI and packaged artifacts when they
  are available. Report evidence for completed acceptance checks and identify
  any remaining blockers.

See the [DarkFactory workflow](https://github.com/marcelpetrick/DarkFactory).
