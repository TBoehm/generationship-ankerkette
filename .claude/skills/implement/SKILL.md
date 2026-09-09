---
name: implement
description: Orchestrate a ready-for-dev task from ticket to pull request. Use when the user asks to implement, build or work on a TASK-NNN. Calls the sub-skills in a fixed order and does not skip the gates.
---

# implement

Orchestrator. It reads the ticket, sets up isolation, implements, runs the
gates until clean, and opens the pull request. It delegates; it does not
reimplement what a sub-skill already covers.

## Order

| Step | What |
| --- | --- |
| 0 | Confirm GitHub access works before doing anything that ends in a push |
| 1 | Read the ticket in `sources/tracking/`, resolve the feature slug |
| 2 | Read the spec and `CLAUDE.md` **through a subagent** (`sonnet`) that returns a digest, so the raw text never lands in the main context. Missing spec and the spec bar is met → `spec-writing` first |
| 3 | **Open questions to the user.** The only interactive stop |
| 4 | `feature-worktree` to branch off freshly fetched `origin/develop` |
| 5 | Implement. Fan out independent files to parallel subagents (`sonnet`); load-bearing design decisions go to `opus` |
| 6 | `gate-runner` until zero blockers and zero majors |
| 7 | Short report to the user, then `publish` |
| 8 | Report the pull request URL, run `dev-server-cleanup`. The worktree stays for `pr-roundtrip` |

## Step 3, open questions

Ask everything that would otherwise be a guess, in one message: ambiguous
acceptance criteria, a figure that `CLAUDE.md` does not fix, a UI decision
the ticket left open. After this step, run through to the pull request
without stopping.

## Design figures

If the work changes a number that `CLAUDE.md` derives, recalculate every
dependent value and update `CLAUDE.md` in the same pull request. A figure
that moves in the code and not in `CLAUDE.md` is a blocker, not a nit.

## Test first

Logic code is written test first: the failing case, then the implementation.
This covers `src/domain/**`, `src/infrastructure/**`, and the logic-carrying
files in `src/presentation/**` (hooks, reducers, selectors, validators,
use cases, repositories, mappers). Pure render components, styling files and
constants files are exempt.

Only tests that run unattended on GitHub CI belong in the suite: Vitest in
jsdom. There is no browser level and no end-to-end level in this project. A
WebGL scene is therefore verified through its extracted maths in
`src/domain/**`, not by rendering it.
