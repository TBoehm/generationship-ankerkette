---
name: code-quality-gate
description: Review changed code with a fresh-context subagent for rule violations and semantic drift. Use from gate-runner whenever src or a build config was touched.
---

# code-quality-gate

Mechanical gates catch mechanical faults. This one catches the rest, and it
only works from a context that never saw the implementation being written.

## Briefing

Send a subagent on `opus`. The briefing must contain, in this order:

1. **Intent** of the implementer, one to three sentences, phrased as the
   user-visible result. Without it the reviewer finds style problems and
   misses semantic drift.
2. The **exact list of changed files**. Paths, never globs.
3. The **project rule block** below.
4. **Output format**: a numbered list, each item `[blocker|major|minor|nitpick]`
   plus `file:line`. No praise, no summary, no sign-off. Problems only.
5. The reviewer writes **no code**. Detection only.

If the branch carries a spec, its verification criteria are checked
explicitly. Half met is a `major`.

## Project rule block

- **Layering.** Dependencies point inward: presentation → infrastructure →
  domain. `src/domain/**` imports neither of the outer layers, and neither
  `three` nor `react`. It touches no browser API and no network. ESLint
  enforces the imports; the reviewer catches what is smuggled past it, such
  as a browser assumption baked into a pure function.
- **Repository naming follows the data type, not the screen.**
  `DocumentRepository`, not `HomeRepository`. Methods `observeDrafts`, not
  `observeHomeData`. Screen-specific aggregation belongs in
  `src/domain/usecases/`. A violation is a `major`.
- **Ports** live in `src/domain/repositories/`, implementations in
  `src/infrastructure/<entity>/`.
- **Test coverage.** Logic code without a test is a `major`. Exempt: pure
  render components, styling files, constants files.
- **Test-after symptoms** are a `minor`. Do not check timestamps, check
  symptoms: tests that mirror the implementation line for line instead of
  specifying behaviour; tautological assertions; tests that would stay green
  with the branch inverted; only a happy path although the code handles
  errors.
- **CI-safe tests only.** Vitest in jsdom. A test that needs a real browser,
  a network, a wall clock or a rendered WebGL context does not belong in the
  suite. Extract the maths into `src/domain/**` and test that instead.
- **Design figures.** A number that `CLAUDE.md` derives may not diverge in
  the code. If the change moves one, every dependent value and `CLAUDE.md`
  move with it, in the same pull request. Divergence is a `blocker`.
- **i18n.** German first, no fallback strings, dot notation without a
  namespace, DE and EN in parity. A literal user-facing string in JSX is a
  `major`.
- **CSS.** One CSS file per component, no inline styles, no raw values.
  Everything resolves to a token from
  `src/presentation/styles/tokens.css`.
- **Language.** Code, identifiers, comments, test names, skill files and
  READMEs in English. Specs, commits, pull request text and tickets in
  German. Two languages in one file is a `major`.
- **Comments.** None by default. The exceptions are functional directives
  and the one design reference line at the top of each view file.
- **Secrets.** Nothing secret in the repository and nothing in the build. A
  static bundle is public and has no runtime environment.
