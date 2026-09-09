import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Every pull request carries a version bump. The published baseline is
 * whatever main holds, so the check compares against origin/main and never
 * against the local branch.
 */
function readPublishedVersion() {
  try {
    execFileSync('git', ['fetch', '--quiet', 'origin', 'main'], { stdio: 'ignore' });
  } catch {
    // offline or no remote, fall through to whatever ref is already present
  }
  for (const ref of ['origin/main', 'main']) {
    try {
      const raw = execFileSync('git', ['show', `${ref}:package.json`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return JSON.parse(raw).version;
    } catch {
      continue;
    }
  }
  return null;
}

function parse(version) {
  const parts = String(version).split('.').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) return null;
  return parts;
}

function isGreater(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

const current = JSON.parse(readFileSync('package.json', 'utf8')).version;
const published = readPublishedVersion();

if (published === null) {
  console.log(`version:check skipped, main carries no package.json yet (local ${current})`);
  process.exit(0);
}

const currentParts = parse(current);
const publishedParts = parse(published);

if (!currentParts || !publishedParts) {
  console.error(`version:check failed, not semver: local ${current}, main ${published}`);
  process.exit(1);
}

if (!isGreater(currentParts, publishedParts)) {
  console.error(
    `version:check failed, ${current} does not exceed the published ${published}. ` +
      'Run npm version patch --no-git-tag-version before opening the pull request.'
  );
  process.exit(1);
}

console.log(`version:check ok, ${current} exceeds the published ${published}`);
