---
name: plan-task
description: Turn a rough request into a ready-for-dev task under sources/tracking/. Use when the user describes something they want built or changed and no TASK file exists yet. Writes a ticket, never a technical spec and never code.
---

# plan-task

Input is a request in the user's words. Output is one task file under
`sources/tracking/`, nothing else. No spec, no branch, no code.

## Steps

1. Read `CLAUDE.md` and skim `sources/tracking/` so the new task does not
   restate or contradict an existing one.
2. Allocate the next free ID by listing `sources/tracking/` on the remote
   default branch, not the working tree: a parallel session may hold an ID
   that is not in your checkout.
   `git ls-tree --name-only origin/develop sources/tracking/`
3. **Interview the user.** This is the only interactive stop in planning.
   Ask about, and do not invent answers for:
   - the goal in one sentence, phrased as a user-visible outcome
   - scope, including an explicit out-of-scope list
   - acceptance criteria, each one checkable
   - whether it touches the UI
   - dependencies, named as concrete `TASK-NNN`
4. If the request contradicts a design figure in `CLAUDE.md`, stop and
   resolve that first: either the request is wrong, or `CLAUDE.md` needs
   recalculating and that is its own task. Never let a ticket silently
   diverge from the design record.
5. Write the task file and check the Definition of Ready honestly. Only
   then set `status: ready-for-dev`.
6. Commit and push. German for the ticket text and the commit message.

## Task file

`sources/tracking/TASK-NNN-<slug>.md`, written in German:

```markdown
---
id: TASK-NNN
titel: <kurz>
status: ready-for-dev
ui: ja|nein
abhaengigkeiten: [TASK-NNN, ...]
---

## Ziel
Ein Satz, user-sichtbares Ergebnis.

## Scope
Was dazugehört.

## Nicht im Scope
Was ausdrücklich nicht dazugehört.

## Akzeptanzkriterien
- [ ] prüfbar formuliert

## Definition of Ready
- [ ] Ziel und Scope eindeutig
- [ ] Akzeptanzkriterien prüfbar
- [ ] Abhängigkeiten benannt und erledigt oder eingeplant
- [ ] Betroffene Auslegungsgrößen aus CLAUDE.md benannt
```

## Do not

- Do not write file paths, component names or a test matrix. That is
  `spec-writing`.
- Do not start implementing, even for a one-line change.
- Do not mark a task ready-for-dev with an unanswered question in it.
