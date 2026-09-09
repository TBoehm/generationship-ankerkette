# Ankerkette

Interactive visualisations of a physically worked-through generation ship bound for
Proxima Centauri. A statically served React/Vite single page app on GitHub Pages.

## Getting started

```bash
npm ci
npm run dev
```

The port is derived from the worktree path rather than fixed, so two sessions can
run side by side. `ANKERKETTE_PORT` overrides it.

## The three documents

| File | Contents |
|---|---|
| `CLAUDE.md` | The ship's design record, in German. Every figure is derived, none guessed. Move one and you recalculate the dependent values and update the file |
| `webapp-entwicklungsablauf.md` | Development process, the role of each skill, the quality gates |
| `sources/README.md` | The two knowledge layers, ticket and spec |

## Process

Ticket via `/plan-task` into `sources/tracking/`, implementation via `/implement` in
its own worktree, gates via `/gate-runner`, pull request against `develop`. Only a
merge into `main` publishes, and that merge belongs to a human.

## Gates

```bash
npm run qa                 # every gate, each one runs on even after an earlier failure
npm run qa -- --job checks # format, lint, i18n, language, version, without the build
```

The list lives as code in `scripts/ci-gates.mjs`. Both Actions workflows call that
same runner, and `scripts/ci-gates.test.mjs` turns red the moment a pipeline job
walks past it.

Tests run under Vitest in jsdom, which is the part that runs unattended on GitHub
CI. There is no browser level and no end-to-end level. What a WebGL scene computes
therefore lives in `src/domain/` and is verified there.

## Language

Code, identifiers, comments, test names, skill files and this README are English
everywhere. German reaches the code only through `src/locales`, never as a literal
and never in a comment. `npm run lang:check` enforces it; a deliberate exception
carries `lang-check-ignore` on its line.

Tickets, specs, commit messages and pull request text are German, and so is
`CLAUDE.md`: it is the design record, and its terminology is German throughout.

## Publishing

A push to `main` builds, checks, publishes to GitHub Pages, then tags and releases.
The base path is `/generationship-ankerkette/`. `404.html` ships as a copy of
`index.html`, otherwise every reload on a sub-route would 404. `pages:check`
verifies both against the built output.

## Legacy

`legacy/` holds the three original single-file documents that needed no build step.
They are the source for the port in TASK-001 and are no longer developed.
`legacy/flugbahn-alpha-centauri.html` still aims at α Cen AB and is therefore
computed for a different target.
