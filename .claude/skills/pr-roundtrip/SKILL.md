---
name: pr-roundtrip
description: Work through the review comments on an open pull request. Use when a reviewer has left feedback. Fixes code and asks questions first, and sends nothing outward before the user says go.
---

# pr-roundtrip

Hybrid by design: fix and ask in the chat first, push and reply only after
an explicit go.

## Steps

1. Resolve the pull request from the current branch and pull its review
   threads.
2. **Triage each thread**: clear and actionable, or unclear. When in doubt,
   unclear. A wrong fix costs more than a question.
3. Fix the clear ones. A fix that touches the UI means re-checking the
   affected component tests in the same pass.
4. `gate-runner` until clean.
5. **Report in the chat and stop.** Per thread: `file:line`, what was asked,
   what changed, and the draft reply. Open questions asked directly.
6. Only after the go: push, post the replies, and resolve only the threads
   that were actually fixed.

## Never

- Never resolve a thread you did not address.
- Never post a reply before step 6.
- Never silently widen the pull request because a reviewer's remark
  suggested a larger refactor. That is a new task.
