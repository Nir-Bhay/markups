# Markups Verification Gates

This is the current local verification checklist. Results must be recorded from
the current commit; historical output is not evidence for a later change.

## Required before handoff

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run build:modular`
- [ ] `npm run test:coverage`
- [ ] `npm run test:e2e`
- [ ] `npm run verify:health`
- [ ] `npm audit`

## Required for user-facing changes

- [ ] Add or update focused unit tests.
- [ ] Run a browser smoke test for the affected workflow.
- [ ] Check keyboard and reduced-motion behavior for UI changes.
- [ ] Check Markdown/HTML insertion boundaries for user-controlled values.
- [ ] Confirm generated files are not being added to Git.

## Evidence format

For each gate, record:

- command
- commit or working-tree state
- exit code
- relevant summary
- known warnings or limitations

Do not mark a gate complete from an older branch, an older build, or a
different entry point.
