---
name: feature-worktree
description: Create or tear down the isolated git worktree for a task. Use at the start of an implementation and again after its pull request has merged.
---

# feature-worktree

One worktree per task, one port per worktree. Two sessions can then run side
by side without taking each other's branch or port.

## Create

```bash
git fetch origin develop
git worktree add --no-track -b feat/task-nnn-slug ../ankerkette-task-nnn origin/develop
```

`--no-track` matters: without it a bare `git pull` drags `develop` into the
feature branch.

Then link the dependencies instead of reinstalling them:

```bash
ln -s "$(git rev-parse --show-toplevel)/node_modules" ../ankerkette-task-nnn/node_modules
```

If the task adds a dependency, remove the link and run a real `npm install`
in the worktree so the lockfile is correct.

## Ports

Never name a port from memory. `scripts/port.mjs` derives it from the
worktree path, and `npm run dev` and `npm run preview` both go through it.
`ANKERKETTE_PORT` overrides it when something else already holds the port.

## Tear down

Only after the pull request has merged, in this order:

```bash
git merge-base --is-ancestor feat/task-nnn-slug origin/develop   # gate
git -C ../ankerkette-task-nnn status --porcelain                 # must be empty
rm ../ankerkette-task-nnn/node_modules                           # the link
git worktree remove ../ankerkette-task-nnn
git branch -d feat/task-nnn-slug
```

If the ancestor gate fails, the branch carries work that `develop` does not
have. Do not delete it. Ask.
