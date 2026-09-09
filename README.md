# Ankerkette

Interaktive Visualisierungen eines physikalisch durchgerechneten Generationenschiffs
nach Proxima Centauri. Statisch ausgelieferte React/Vite-SPA auf GitHub Pages.

## Loslegen

```bash
npm ci
npm run dev
```

Der Port wird aus dem Worktree-Pfad abgeleitet, nicht fest vergeben, damit zwei
Sessions parallel laufen können. `ANKERKETTE_PORT` überschreibt ihn.

## Die drei Dokumente

| Datei | Inhalt |
|---|---|
| `CLAUDE.md` | Auslegungsstand des Schiffs. Alle Zahlen sind hergeleitet. Wer eine Größe bewegt, rechnet die abhängigen Werte nach und pflegt die Datei mit |
| `webapp-entwicklungsablauf.md` | Entwicklungsablauf, Rollen der Skills, Quality Gates |
| `sources/README.md` | die zwei Wissensschichten, Ticket und Spec |

## Ablauf

Ticket über `/plan-task` nach `sources/tracking/`, Umsetzung über `/implement` in
einem eigenen Worktree, Gates über `/gate-runner`, Pull Request gegen `develop`.
Nur ein Merge nach `main` veröffentlicht, und dieser Merge gehört dem Menschen.

## Gates

```bash
npm run qa                 # alle Gates, jeder läuft auch nach einem Fehlschlag weiter
npm run qa -- --job checks # Format, Lint, i18n, Version, ohne Build
```

Die Liste steht als Code in `scripts/ci-gates.mjs`. Die Actions-Workflows rufen
denselben Runner, und `scripts/ci-gates.test.mjs` wird rot, sobald ein Pipeline-Job
daran vorbeiläuft.

Getestet wird mit Vitest in jsdom, also nur mit dem, was unbeaufsichtigt auf der
GitHub CI läuft. Es gibt kein Browser-Level und kein End-to-End-Level. Was eine
WebGL-Szene rechnet, liegt deshalb in `src/domain/` und wird dort geprüft.

## Veröffentlichung

Push auf `main` baut, prüft und veröffentlicht auf GitHub Pages, danach Tag und
Release. Der `base`-Pfad ist `/generationship-ankerkette/`. `404.html` geht als
Kopie der `index.html` mit, sonst wäre jeder Reload auf einer Unterroute ein 404.
`pages:check` prüft beides am gebauten Ergebnis.

## Legacy

`legacy/` enthält die drei ursprünglichen Einzeldokumente ohne Build-Schritt. Sie
sind die Vorlage der Portierung in TASK-001 und werden nicht weiterentwickelt.
`legacy/flugbahn-alpha-centauri.html` zielt noch auf α Cen AB und ist damit auf ein
anderes Ziel gerechnet.
