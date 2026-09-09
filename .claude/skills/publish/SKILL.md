---
name: publish
description: Bump the version, commit, push and open the pull request against develop. Use as the closing step of an implementation, after the gates are clean.
---

# publish

Runs only at zero blockers and zero majors.

## Order

Version bump → commit → push → pull request. In that order, because
`version:check` compares the pushed branch against `origin/main`.

```bash
npm version patch --no-git-tag-version
```

Minor for a new user-visible feature, major for a breaking change. The bump
is mandatory and mechanically enforced.

## Commit

German, imperative, one line of subject plus a body that says why. Reference
the task: `TASK-NNN`.

## Pull request

- Target branch: **`develop`**. Never `main`.
- One pull request carries exactly one task.
- `TASK-NNN` appears in the branch name **and** in the title, otherwise the
  task keeps no link to its pull request.
- Body in German: what changed, which acceptance criteria it satisfies,
  which design figures it touched, what was deliberately left out.
- If a figure in `CLAUDE.md` moved, say which, and say that the dependent
  values were recalculated.

Follow-up commits on an open pull request go out immediately. The branch is
already published, an update is not a new approval gate.

## Never

Never merge, never push to `main`, never trigger the deploy workflow by
hand. The merge is the deploy trigger and it belongs to the user alone.
