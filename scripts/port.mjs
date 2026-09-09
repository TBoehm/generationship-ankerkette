import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BASE = 5180;
const RANGE = 100;

/**
 * Resolve the dev/preview port for the current checkout.
 *
 * Every worktree gets its own deterministic port so two sessions can run the
 * dev server and the browser-unit suite side by side without colliding. The
 * port is derived from the worktree path, never remembered by hand.
 */
export function resolvePort() {
  if (process.env.ANKERKETTE_PORT) return Number(process.env.ANKERKETTE_PORT);
  let root;
  try {
    root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    root = process.cwd();
  }
  const digest = createHash('sha1').update(root).digest();
  return BASE + (digest.readUInt16BE(0) % RANGE);
}

export const PORT = resolvePort();
