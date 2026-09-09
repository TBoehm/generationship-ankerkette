---
name: gate-runner
description: Run the quality gates in their binding order until nothing is left to fix. Use before every pull request and after every round of review fixes. The gates are part of the task, not a step that follows it.
---

# gate-runner

A task is not finished while a gate is red.

## Order

| # | Step | Note |
| --- | --- | --- |
| 0 | `git fetch origin && git merge origin/develop` | before the pre-PR run, so the gates do not judge a stale base |
| 1 | `npm run format` | writes, always passes |
| 2 | `npm run lint:fix` | until zero errors and zero warnings |
| 3 | `npm run qa` | the whole mechanical set in one command |
| 4 | review subagents | see the trigger matrix |

`npm run qa` runs `format:check`, `lint`, `i18n:check`, `version:check`,
`test:ci`, `build` and `pages:check`. Every gate runs even after an earlier
one failed, so one red run names all its findings at once.

In the fix loop, `npm run qa -- --job checks` skips the build. Run the full
set once before the pull request.

The gate list lives in `scripts/ci-gates.mjs` as code, and the Actions
workflow calls that same runner. `scripts/ci-gates.test.mjs` goes red if a
pipeline job walks past it. Never maintain the list by hand in two places.

## The local run is a superset of CI

Nothing runs in the pipeline that did not run here first, and never a
weaker variant of the same check. What CI does not have is the review
subagents: they run locally only, and they are the part of the gate no
pipeline replaces.

## A red mechanical gate blocks the pull request

Even when the cause demonstrably already sits on `develop`. "Documented in
the PR" is not a fix. Order of remedy: merge current `origin/develop` and
re-run, otherwise land the fix in its own pull request, otherwise ask.

## Trigger matrix

| Touched | Gate |
| --- | --- |
| `src/**`, `vite.config.js`, `eslint.config.js`, `tailwind.config.js`, `src/locales/**` | `code-quality-gate` |
| additionally any component, page or CSS, down to a single token or class name | `design-quality-gate` |

With UI, code review and design QA run **in parallel**: two `Agent` calls in
one message. When in doubt, both.

## Loop

Fix every blocker and major, plus every medium from the design gate. Re-run
the mechanical phases, then send a **fresh** subagent each round, never a
reused one. Two rounds are normal. From the third round on, rethink the
approach instead of patching further, and tell the user so.

Only at zero blockers and zero majors may the work be reported as done.

## Allowed exceptions

Either the task was read-only, or the user explicitly said to skip the
gates. Both have to be stated in the closing report. Silently leaving them
out is not permitted.
