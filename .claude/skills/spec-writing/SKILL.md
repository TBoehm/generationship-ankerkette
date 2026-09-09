---
name: spec-writing
description: Write or refine the implementation contract for a task under sources/specs/. Use when a task is larger than one file or thirty lines and is either ambiguous or will be split across parallel agents.
---

# spec-writing

A spec is a contract between the ticket and the code. It says how, and how
the result is verified. It never re-argues why, that is the ticket's job.

## When a spec is required

More than one file **or** more than thirty lines of change, **and** the work
is either ambiguous or will be fanned out to parallel agents. Below that
bar, implement directly against the ticket.

## Location

`sources/specs/<feature-slug>/SPEC.md`, with `abgeleitet_aus: TASK-NNN` in
the frontmatter. Written in German.

## The seven mandatory sections

1. **Kontext** — which task, which acceptance criteria this spec covers.
2. **Dateien** — every path that will be created or changed, with its layer
   (`domain`, `infrastructure`, `presentation`). A path not listed here is
   out of bounds for the implementation.
3. **Verträge** — exported function signatures, i18n keys, route paths,
   token names. Anything another file will import.
4. **Testmatrix** — per logic-carrying file: the happy path, the branches,
   the error cases. Each row becomes a `*.test.js` case.
5. **Owns / Forbidden** — what this spec owns exclusively, and files it must
   not touch. This is what makes a parallel fan-out safe.
6. **Verifikationskriterien** — how a reviewer checks the result without
   reading the implementation.
7. **Offene Fragen** — empty before implementation starts.

## Budgets

Keep a spec under roughly 400 lines. Past that, decompose: split by layer
(domain contract first, then the view), by feature vertical, or by a
sequential core plus parallel leaves. Every part gets its own Owns list, and
two parts never own the same file.

## Refining an existing spec

Change the spec before changing the code, never after. A spec that
documents what the code already does is worthless as a contract.
