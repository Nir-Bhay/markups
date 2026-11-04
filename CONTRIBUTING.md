# Contributing to Markups

Thank you for helping improve Markups. Try the [hosted editor](https://markups.dev/) or run it locally before reporting a problem.

## Report a problem or propose a feature

Use the repository's issue forms. Include browser/OS, reproducible steps, expected behavior and actual behavior. Use a small disposable Markdown example; remove private documents, tokens, share links and account information. Search existing issues first. Explain the user problem for feature requests.

Report security vulnerabilities through the private reporting route in [SECURITY.md](SECURITY.md), rather than public issues. Follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Local development

Use Node 24 satisfying the engine range in `package.json`.

```sh
git clone https://github.com/Nir-Bhay/markups.git
cd markups
npm ci
npm run dev
```

The root route is the editor; `/landing` is the React product page. The production editor entry is `src/main.js`; the modular entry remains experimental. See `AI-DOCS/QUICK-START.md` for navigation and `AGENTS.md` for repository instructions.

## Pull requests

Create a focused branch from current `main`. Explain the problem, changed behavior and validation. Keep unrelated cleanup separate. Preserve local drafts and avoid sending document content to telemetry. New optional network features need explicit user intent and documented configuration. Never commit secrets, local environment files or real user data.

Run checks appropriate to the changed behavior. Application changes normally require `npm run lint`, `npm run typecheck:landing`, `npm test`, `npm run build`, and relevant built browser checks (`npm run test:e2e:built`). Documentation-only changes need link/content review, not an unrelated full browser suite. Report checks that were not run honestly. Production validation and release gates are described in `docs/RELEASE-RUNBOOK-2026-11-04.md`.

Maintainers review correctness, privacy, accessibility and scope. Contributions remain under the repository's MIT license; do not submit material you cannot license that way.
