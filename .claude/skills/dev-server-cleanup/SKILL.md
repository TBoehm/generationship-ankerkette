---
name: dev-server-cleanup
description: Release ports and background processes at the end of a task. Use as the last step of every implementation, and whenever a dev or preview server was started.
---

# dev-server-cleanup

Leaving a server running costs the next session its port and quietly serves
stale output.

## Steps

1. Stop every background shell this session started.
2. Resolve this worktree's port and check it is free:
   ```bash
   node -e "import('./scripts/port.mjs').then(m => console.log(m.PORT))"
   ```
3. Kill only what is still listening on **this worktree's** port. Leave
   other ports alone, another session owns them.
4. Never kill the node process running the session itself.
5. Say in the closing report which ports were released, or that none were
   in use.
