# Webapp-Entwicklung — Ablauf, Skills, Quality Gates

Statisch ausgelieferte React/Vite-SPA · GitHub · GitHub Actions · GitHub Pages

Kein Backend, keine Datenbank, kein Server-Rendering zur Laufzeit: der Build erzeugt statische
Assets, die Pages ausliefert.

---

## 1. Ablauf in einer Zeile

Fachliches Ticket → `/plan-task` → ready-for-dev Task im Wiki → `/implement` → Worktree → Spec →
Code (TDD) → Quality Gates → PR gegen `develop` → `/pr-roundtrip` → User merged `develop` → `main`
→ Actions baut und veröffentlicht auf Pages.

Zwei interaktive Stopps im gesamten Weg: das Interview in `/plan-task`, die offenen Fragen in
`/implement`. Danach läuft alles bis zum PR durch.

---

## 2. Drei Wissensschichten

| Schicht | Ort | Inhalt | Frage |
| --- | --- | --- | --- |
| Konzept | `concept-wiki/` (Git-Submodule) | Capabilities → Features → FeatureVariants (`platform: web`), DomainConcepts, DataModels, ADRs, UXFlows, Tracking (Epics/Tasks/Bugs) | Warum / Für wen / Was |
| Spec | `sources/specs/<feature>/` | Umsetzungsvertrag: Dateipfade, i18n-Keys, Routen, Test-Matrix, Owns/Forbidden | Wie / Wie verifiziert |
| Code | `src/**` | Implementierung gegen die Spec | — |

- Autorität fließt runter (Konzept → Spec → Code), Signale fließen hoch.
- Repo-Specs zeigen per `derived_from` ins Wiki. Wiki-Dateien verlinken **nie** Repo-Code.
- Fachliches Delta beim Coden → **Promotion**: erst Wiki fixen, dann Spec, dann Code. Nie still
  abweichen.
- Tracking-Änderungen bewegen den Submodule-Pin **nicht**. Nur Concept-Änderungen rechtfertigen
  einen Pin-Bump — und der braucht eine Reconcile-Attestation (`.reconcile/<sha>.md`), erzwungen
  von einem Gate-Script.

---

## 3. Skills (`.claude/skills/`)

| Skill | Rolle |
| --- | --- |
| `plan-task` | Fachliches Ticket → ready-for-dev Tracking-Task im Wiki. Interview, Konzept-Reconcile, DoR-Check, Commit + Push ins Wiki. Schreibt **keine** technische Spec, **keinen** Code. |
| `spec-writing` | Spec schreiben/refinen/zerlegen. 7 Pflicht-Sektionen, Token-Budgets, Decomposition-Patterns. |
| `implement` | Orchestrator Spec → PR. Ruft die Sub-Skills in fester Reihenfolge. |
| `feature-worktree` | Worktree anlegen/abräumen, `node_modules`-Junction, Ancestor-Gate beim Teardown. |
| `gate-runner` | Orchestriert die Gates in ihrer verbindlichen Reihenfolge, Trigger-Matrix, Loop. |
| `code-quality-gate` | Mechanische Phasen + Fresh-Context-Code-Review. Owner der Code-Regeln. |
| `design-quality-gate` | Owner der visuellen Regeln (Tokens, Typo-Rollen, Mobile-First, Touch-Targets, A11y). |
| `publish` | Version-Bump, Commit, Push, `gh pr create`, TASK↔PR-Linkage. |
| `pr-roundtrip` | Review-Kommentare eines PR abarbeiten. Hybrid: nichts nach außen ohne User-OK. |
| `repo-reconcile` | Sweep nach Wiki-Update: was muss das Repo lokal nachziehen. Erzeugt die Attestation. |
| `wiki-maintain` / `wiki-reviews` | Wiki-Health-Check bzw. Triage der `needs-review`-Queue. |
| `dev-server-cleanup` | Pflicht-Aufräumen am Task-Ende: Ports, Background-Bashes, Dev-Server. |

Wiki-Bedienung selbst (`wiki-read`/`wiki-write`/`wiki-update`/`wiki-track`) liegt **im Submodule**
(`concept-wiki/skills/`), nicht im Repo.

---

## 4. `/plan-task` — Planung

1. Wiki-Submodule auf `origin/main` bringen. Nächste freie TASK-ID **aus dem Remote-Tree** lesen,
   nie aus dem Working Tree.
2. Wiki-Kontext lesen (delegiert an Subagent, damit der Rohtext nicht in die Session fällt).
3. **Interview** (einziger Stopp): Ziel, Scope inkl. explizitem Out, Akzeptanzkriterien, UI ja/nein,
   Dependencies als konkrete `TASK-NNN`.
4. Konzept-Reconcile, wenn das Ticket dem Wiki widerspricht ("concept change spawns impl task").
5. Task via `wiki-track` anlegen, DoR ehrlich abhaken → `status: ready-for-dev`.
6. Zwei getrennte Wiki-Commits (Concept-Reconcile ≠ Tracking), Push auf `main`. Pin bleibt stehen.

Ergebnis: ein Ticket, kein Code, keine Spec.

---

## 5. `/implement` — Umsetzung bis PR

| Schritt | Inhalt |
| --- | --- |
| 0 | `gh auth status` prüfen |
| 1 | Wiki-Working-Tree auffrischen, Feature-Slug + `<TASK>` auflösen |
| 2 | Spec + Konzept lesen (**Subagent**, `sonnet`, liefert Digest). Fehlt die Spec und greift das Mandat → `spec-writing` |
| 3 | **Offene Fragen** — der einzige interaktive Stopp |
| 4 | `feature-worktree` (`worktree add --no-track -b feat/task-nnn-slug` von `origin/develop`) |
| 4a | Nur bei Pin-Bump: neuer Wiki-SHA + `.reconcile/<sha>.md` reisen im **selben** PR |
| 5 | Implementieren. Fan-out auf parallele Subagents (`sonnet`), tragende Design-Entscheidungen auf `opus` |
| 6 | `gate-runner` bis 0 Blocker / 0 Major |
| 7 | Kurzer Report, dann `publish` (PR gegen `develop`) |
| 8 | PR-URL melden, `dev-server-cleanup`. Worktree bleibt stehen für `/pr-roundtrip` |

Spec-Pflicht: **> 1 Datei oder > 30 LOC UND (mehrdeutig ODER parallelisiert)**.

---

## 6. Architektur

### Clean Architecture, drei Schichten

```
src/
├── domain/          constants, entities, repositories (Ports), usecases, utils
├── infrastructure/  Browser-Storage, Laden statischer Datenassets, i18n, config
└── presentation/    components, pages, hooks, contexts, styles, testing
```

- Abhängigkeiten zeigen nach innen: presentation → infrastructure → domain.
- `domain` importiert **nie** aus presentation/infrastructure.
- **Repository-Naming nach Datentyp**, nicht nach Screen: `CustomerRepository`,
  `DocumentRepository`. `HomeRepository` ist verboten. Methoden datentyp-zentriert
  (`observeDrafts`), nicht screen-zentriert (`observeHomeData`). Screen-spezifische Aggregation →
  `src/domain/usecases/`. Verstoß = `major`.
- Port in `src/domain/repositories/`, Implementierung in `src/infrastructure/<entity>/`.
- Alles, was der Browser nicht selbst kann, ist ein Adapter in `infrastructure/` — die Domäne kennt
  weder `fetch` noch `localStorage`.

### Tech-Stack

React + Vite · Tailwind (token-gebunden) · react-i18next · react-router-dom · Vitest · Playwright ·
ESLint flat config · Prettier.

### Konventionen

- Ein CSS-File pro Component (`LoginForm.jsx` → `LoginForm.css`), keine Inline-Styles.
- Tokens statt Hardcoded-Werte (`src/presentation/styles/tokens.css` als SSoT).
- Modals via `createPortal` nach `document.body`, Overlay `fixed; inset: 0; z-index: 9999`.
- i18n: Deutsch first, keine Fallback-Strings, Dot-Notation ohne Namespace, DE/EN-Parität
  mechanisch geprüft (`i18n:check`).
- Mobile-First. Touch-Targets ≥ 44×44px unter 1024px, Desktop-Dichte ab 1024px (nur per
  `@media (min-width: 1024px)`, nie als Basis-Style).
- **Default: keine Kommentare.** Ausnahmen: funktionale Direktiven (`eslint-disable`) und die eine
  Design-Referenz-Zeile am Anfang jeder View-Datei.
- **Sprache:** Code, Identifier, Kommentare, Testnamen, Skill-Files, `CLAUDE.md`, READMEs =
  Englisch. Specs, Commits, PR-Texte, Tickets, Wiki = Deutsch. Nie zwei Sprachen in einer Datei —
  Mischung = `major`.
- **Keine Secrets im Repo und keine im Build.** Alles, was in den Bundle wandert, ist öffentlich —
  ein statischer Build kennt keine Runtime-Env. Konfiguration, die sich pro Umgebung unterscheidet,
  liegt als Konstante im Code und wird beim Build per Mode getreeshakt.

---

## 7. Ansatz: Test-First

### TDD-Pflicht

Aller Logic-Code wird test-first entwickelt: erst der failing `.test.js`-Case, dann die
Implementierung.

- **Gilt für:** `src/domain/**`, `src/infrastructure/**`, logiktragende Files in
  `src/presentation/**` (Hooks, Reducer, Selektoren, Validatoren, Use Cases, Repositories, Mapper).
- **Ausgenommen:** Pure-Render-Components (reine JSX-Komposition + CSS), Styling-Files,
  Konstanten-Files wie `routes.js`.
- Tests co-located als `*.test.js` / `*.test.jsx`. Happy Path + relevante Verzweigungen + Error-Fälle.
- **Reviewer-Enforcement:** fehlende Tests = `major`. Test-after-Symptome = `minor` — der Reviewer
  prüft keine mtimes, sondern Symptome: Tests, die die Implementierung 1:1 spiegeln statt Verhalten
  zu spezifizieren; Tautologie-Assertions; Tests, die auch bei invertierter Branch grün blieben;
  nur Happy Path trotz Error-Handling im Code.

### Test-Ebenen

| Ebene | Ort / Runner |
| --- | --- |
| Unit | co-located `*.test.js(x)`, Vitest-Projekt `unit`, jsdom |
| Browser-Unit | `tests/browser-unit/**/*.browser.spec.js`, Playwright-Projekt `browser-unit` |
| E2E | `tests/e2e/**/*.feature.spec.js`, Playwright-Projekt `e2e`, gegen den **Production-Build** (`vite preview`), nicht gegen den Dev-Server |

E2E gegen den Preview-Build ist bewusst so: nur dort greifen `base`-Pfad, Asset-Hashing und der
404-Fallback so wie später auf Pages. Ein grüner Lauf gegen den Dev-Server beweist genau die Klasse
Fehler nicht, die eine statische Auslieferung produziert.

### E2E-Zulassungsregel (hart)

Ein `*.feature.spec.js` deckt einen **User-Flow durch die laufende App**. Zulässig nur, wenn alle
drei Punkte gelten:

1. Er überschreitet eine Grenze, die ein Unit-Test nicht überschreiten kann — echtes Routing über
   die History-API, Deep-Link auf eine Route, Laden eines statischen Datenassets über das Netz,
   Persistenz über einen Reload, Browser-API ohne jsdom-Äquivalent (IntersectionObserver, Clipboard,
   File/Blob, Drag-Sensoren).
2. Er assertet ein Ergebnis, keinen Zwischenzustand.
3. Sein Fehlschlag bedeutet, dass ein User sein Ziel nicht erreicht.

**Ausgeschlossen ohne Ausnahme:** alles, was als Unit-Test schreibbar ist — Formularvalidierung,
enabled/disabled, `aria-*`, Fokusreihenfolge, Escape/Scrim-Dismissal generischer Komponenten,
`href`/`target`/`rel`, Ableitungen aus Daten (Zähler, Sortierschlüssel, Titel-Mappings), Existenz
eines Buttons, Geometrie-Assertions, Tests gegen ein per `page.route` gemocktes Netz. Ein neuer
Spec, der das bricht, ist ein `major`-Finding. Braucht ein Unit-Test nur eine Browser-API, geht er
nach `tests/browser-unit/`, nie in die E2E-Suite.

---

## 8. Quality Gates

Die Gates sind Teil der Aufgabe, kein Folgeschritt. Eine Aufgabe ist nicht fertig, solange sie nicht
durchgelaufen sind.

### Reihenfolge (`gate-runner`)

| # | Schritt | Kommentar |
| --- | --- | --- |
| 0 | `git fetch origin` + `git merge origin/develop` | vor dem Pre-PR-Lauf, sonst läuft das Gate auf einer veralteten Basis |
| 1 | `npm run format` | schreibt |
| 2 | `npm run lint:fix` | bis 0 Errors / 0 Warnings |
| 3 | **`npm run qa`** | die komplette CI-Spiegelung in einem Kommando |
| 4 | `npm run e2e` | gegen den Preview-Build |
| 5 | Review-Subagent(s) | siehe Trigger-Matrix |

### `npm run qa` — die mechanischen Gates

`format:check` · `lint` · `repo-reconcile` · `version:check` · `test:ci` · `build` · `e2e`

- Die Liste steht **als Code** in `scripts/ci-gates.mjs`. Der Actions-Workflow ruft denselben
  Runner, ein Mirror-Test wird rot, sobald ein Pipeline-Job daran vorbeiläuft. Keine Liste von Hand
  pflegen.
- Jedes Gate läuft auch nach einem Fehlschlag weiter — ein roter Lauf nennt alle Befunde auf einmal.
- Im Fix-Loop reicht `npm run qa -- --job checks` (spart Build + E2E). Der volle Lauf einmal vor dem
  PR.

### Der lokale Lauf ist ein SUPERSET der CI

Nichts darf in der Pipeline laufen, was hier nicht vorher lief — und nie eine schwächere Variante
derselben Prüfung. `npm run format` schreibt und besteht immer; rot wird `format:check`.

Was die CI **nicht** hat: die Review-Subagents. Die laufen ausschließlich lokal und sind der Teil
des Gates, den keine Pipeline ersetzt.

### Ein rotes mechanisches Gate blockiert den PR

Auch wenn die Ursache nachweislich schon auf `develop` liegt. „Im PR dokumentiert" ist keine Lösung.
Reihenfolge der Abhilfe: aktuellen `origin/develop` mergen und neu laufen lassen → sonst den Fix in
einem eigenen PR landen → sonst User fragen.

### Trigger-Matrix

| Angefasst | Gate |
| --- | --- |
| `src/**`, `vite.config.js`, `eslint.config.js`, `tailwind.config.js`, `src/locales/**` | `code-quality-gate` |
| zusätzlich irgendeine Component / Page / CSS (auch nur ein Token, ein Padding, ein Klassenname) | `design-quality-gate` |

Bei UI laufen Code-Review und Design-QA **parallel** — zwei `Agent`-Calls in EINER Message. Im
Zweifel beide.

### Code-Review-Subagent

Fresh Context, kein Gedächtnis der Implementierungs-Session. Briefing enthält zwingend:

1. **Intent** des Implementierenden (1–3 Sätze, user-sichtbares Ergebnis) — ohne das findet der
   Reviewer nur Style-Probleme, keine semantischen Abweichungen.
2. Exakte Liste der geänderten Dateien (keine Globs).
3. Den Projektregel-Block (i18n, Clean Architecture, Repository-Naming, Test-Coverage,
   TDD-Symptome, CSS-Struktur, Portal-Modals, Input-Sanitization, Asset-Formate, Sprachregel,
   Kommentar-Regel, Design-Referenz-Kommentar).
4. Output-Format: nummerierte Liste, je `[blocker|major|minor|nitpick]` + `file:line`. Kein Lob,
   keine Zusammenfassung, keine Freigabe. Nur Probleme.
5. Der Reviewer schreibt **keinen** Code — Detection only.

Liegt eine Spec im Branch, prüft er deren Verification-Criteria explizit; halb erfüllt = `major`.

### Loop

- Alle `blocker`/`major` fixen (plus `medium` aus dem Design-Gate), mechanische Phasen erneut, dann
  ein **frischer** Subagent pro Runde — nie einen wiederverwenden.
- Zwei Runden sind normal. **Ab der dritten Runde umdenken statt weiterpatchen** — und das dem User
  sagen.
- Erst bei 0 Blocker / 0 Major darf „fertig" gemeldet werden.

### Erlaubte Ausnahmen (eng)

(a) Aufgabe war rein read-only, ODER (b) der User sagt explizit „skip the gates". Beides muss beim
Abschluss genannt werden. Stillschweigend weglassen ist unzulässig.

---

## 9. Isolation: ein Worktree pro Task

- Jede Implementierung läuft in einem eigenen git-Worktree, abgezweigt von frisch gefetchtem
  `origin/develop`, mit `--no-track` (sonst zieht ein blankes `git pull` `develop` in den
  Feature-Branch).
- `node_modules` wird per Junction/Symlink aus dem Haupt-Checkout verlinkt statt neu installiert.
  Kommt eine neue Dependency dazu: Link lösen, echtes `npm install` im Worktree, damit das Lockfile
  stimmt.
- **Jeder Worktree fährt seinen eigenen Dev-/Preview-Port.** Zwei Sessions können parallel `e2e`
  fahren, ohne sich die Ports wegzunehmen. Ports nie aus dem Gedächtnis — der Port kommt aus der
  Worktree-Konfiguration bzw. dem Startskript.
- Teardown erst nach dem Merge, in dieser Reihenfolge: Ancestor-Gate
  (`git merge-base --is-ancestor <branch> origin/develop`) → `git status --porcelain` muss leer sein
  → Junction lösen → `worktree remove --force` → `branch -d`. Schlägt das Ancestor-Gate fehl, nicht
  löschen, sondern fragen.
- Am Task-Ende: `dev-server-cleanup` (Background-Bashes stoppen, eigene Ports prüfen und freigeben,
  eigenen Node-Prozess nicht killen).

---

## 10. Veröffentlichen & Deploy

### PR

- Reihenfolge in `publish`: **Version-Bump → Commit → Push → PR**.
- `npm version patch --no-git-tag-version` ist Pflicht (Minor bei neuem user-sichtbarem Feature,
  Major bei Breaking Change). Mechanisch erzwungen durch `version:check` gegen `origin/main`.
- Ziel-Branch: `develop`. **Ein PR trägt genau einen Task.** `TASK-NNN` steht im Branch **und** im
  Titel, sonst bleibt der Task auf `ready-for-dev` ohne PR-Link.
- Folge-Commits auf einen offenen PR gehen sofort raus — der Branch ist veröffentlicht, ein Update
  ist kein neues Approval-Gate.

### Pipeline (GitHub Actions)

| Ereignis | Ablauf |
| --- | --- |
| Pull Request | Jobs `checks`, `test`, `build`, `e2e`. Rot = kein Merge (Required Status Checks + Branch-Protection auf `develop` und `main`). |
| Push auf `main` | Dieselben Gates, dann Build-Artefakt hochladen und auf Pages veröffentlichen. Danach Tag `v<version>` + Release. |

Nur `main` veröffentlicht. Ein Merge nach `develop` deployt nichts.

### GitHub Pages — was der Build beachten muss

- **`base` in `vite.config.js`** muss zum Pfad passen: `/<repo>/` bei Project Pages, `/` bei
  User-/Org-Pages. Falscher `base` = weiße Seite mit 404 auf allen Assets, und das fällt lokal nicht
  auf.
- **Deep-Links:** Pages kennt kein Rewrite auf `index.html`. Entweder `404.html` als Kopie der
  `index.html` mit ausliefern, oder HashRouter verwenden. Ohne das ist jeder Reload auf einer
  Unterroute ein 404.
- **`.nojekyll`** ins Publish-Verzeichnis, wenn aus einem Branch veröffentlicht wird — sonst
  schluckt Jekyll Ordner mit führendem Unterstrich.
- **Assets sind unveränderlich gehasht**, `index.html` nicht. Cache-Verhalten entsprechend
  einplanen.
- Veröffentlicht wird das Build-Artefakt, nie ein committetes `dist/`. `dist/` bleibt gitignored.

### Deploy-Regel

**Nie selbst deployen.** Nicht selbst nach `main` mergen oder pushen, keinen Deploy-Workflow von
Hand auslösen. Der Merge (= Deploy-Trigger) ist ausschließlich Sache des Users.

---

## 11. `/pr-roundtrip` — Review-Kommentare

Hybrid by design: Code fixen und Fragen im Chat stellen zuerst, **nichts nach außen** (Push,
Antworten, Resolve) vor dem expliziten OK des Users.

1. PR über den Branch auflösen, Review-Threads via `gh` ziehen.
2. Triage pro Thread: klar & umsetzbar vs. unklar. Im Zweifel unklar — ein falscher Fix ist
   schlimmer als eine Rückfrage.
3. Klare Threads fixen; berührt der Fix UI, im selben Pass `tests/e2e/` auf gebrochene Selektoren
   prüfen.
4. `gate-runner` bis grün.
5. Report im Chat: pro Thread `file:line` → was gefordert war, was geändert wurde, plus die
   Entwurfs-Antwort. Offene Fragen direkt stellen. **Stopp.**
6. Nach dem OK: Push, Antworten posten, nur tatsächlich gefixte Threads resolven.

---

## 12. Subagents & Modell-Policy

Parallelisieren ist der Default, sequenziell nur bei echten Dependencies (Output A = Input B),
gemeinsamem Hotspot-File oder < 10 Tool-Calls Gesamtaufwand.

| Wofür | Modell |
| --- | --- |
| Jeder QA-/Review-Subagent (Code, Design) und `advisor` | **`opus`** — immer |
| Tragende Design-Entscheidungen (neue Feature-Vertikalen, Layering, Datenmodell) | **`opus`**, als gepinnter Subagent |
| Lese-Phasen (Spec/Wiki-Digest), Implementierungs-Fan-out, Mechanik (git, Worktree, Publish) | **`sonnet`** |

- Jeder `Agent`-Call trägt sein `model` explizit — nie implizit aus der Session erben.
- Lese-Phasen laufen als Subagent, damit der Rohtext nicht in die Hauptsession fällt: er würde sonst
  auf jedem Folge-Turn als `cache_read` neu abgerechnet.
- Mehrere unabhängige Subagents in **einer** Message starten.

---

## 13. Harte Regeln in Kurzform

1. Gates sind Teil der Aufgabe. „Lint + Tests grün" reicht nicht — der Fresh-Context-Reviewer fängt
   andere Fehlerklassen.
2. Ein rotes mechanisches Gate blockiert den PR, auch bei fremder Ursache.
3. TDD für Logic-Code. Fehlende Tests = `major`.
4. E2E nur für echte User-Flows, und immer gegen den Preview-Build, nie gegen den Dev-Server.
5. Clean-Architecture-Richtung einhalten; Repositories nach Datentyp benennen.
6. Code Englisch, Specs/Commits/PR/Wiki Deutsch, nie gemischt in einer Datei.
7. i18n Deutsch first, keine Fallbacks, DE/EN-Parität.
8. Kein Kommentar ohne Grund; Ausnahme ist die Design-Referenzzeile in View-Files.
9. Keine Secrets im Build — ein statisches Bundle ist öffentlich.
10. Pin-Bump und `.reconcile/<sha>.md` reisen immer im selben PR.
11. Version-Bump vor jedem PR.
12. Ein Worktree, ein Port; Teardown erst nach dem Merge, mit Ancestor-Gate.
13. Niemals selbst deployen, niemals selbst nach `main` mergen.
14. Server und Ports am Ende jeder Aufgabe aufräumen.
