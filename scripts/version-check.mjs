import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Every change carries a version bump, but what counts as "already taken"
 * depends on where the check runs.
 *
 * On a feature branch the baseline is the version sitting on main: the
 * branch has to exceed what is published. On main itself that comparison is
 * meaningless, because main is the commit being checked and would always
 * compare equal to itself. There the baseline is the last release tag, so
 * the gate still catches publishing the same version twice.
 */
function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

export function parseVersion(version) {
  const parts = String(version).split('.');
  if (parts.length !== 3) return null;
  const numbers = parts.map(Number);
  if (numbers.some((n) => !Number.isInteger(n) || n < 0)) return null;
  return numbers;
}

export function isGreater(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

export function chooseBaseline({ onMain, releasedVersion, mainVersion }) {
  if (onMain) {
    return { baseline: releasedVersion, label: 'the last release' };
  }
  return { baseline: mainVersion, label: 'the version published on main' };
}

function readMainVersion() {
  tryGit(['fetch', '--quiet', 'origin', 'main']);
  for (const ref of ['origin/main', 'main']) {
    const raw = tryGit(['show', `${ref}:package.json`]);
    if (raw) {
      try {
        return JSON.parse(raw).version;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function readReleasedVersion() {
  tryGit(['fetch', '--quiet', '--tags', 'origin']);
  const tags = tryGit(['tag', '--list', 'v*']);
  if (!tags) return null;
  const versions = tags
    .split('\n')
    .map((tag) => parseVersion(tag.replace(/^v/, '')))
    .filter(Boolean);
  if (!versions.length) return null;
  versions.sort((a, b) => (isGreater(a, b) ? -1 : 1));
  return versions[0].join('.');
}

function isOnMain() {
  const head = tryGit(['rev-parse', 'HEAD']);
  const main = tryGit(['rev-parse', 'origin/main']) ?? tryGit(['rev-parse', 'main']);
  return Boolean(head && main && head === main);
}

function main() {
  const current = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const onMain = isOnMain();
  const { baseline, label } = chooseBaseline({
    onMain,
    releasedVersion: readReleasedVersion(),
    mainVersion: readMainVersion(),
  });

  if (baseline === null) {
    console.log(`version:check skipped, ${label} does not exist yet (local ${current})`);
    return;
  }

  const currentParts = parseVersion(current);
  const baselineParts = parseVersion(baseline);

  if (!currentParts || !baselineParts) {
    console.error(`version:check failed, not semver: local ${current}, baseline ${baseline}`);
    process.exit(1);
  }

  if (!isGreater(currentParts, baselineParts)) {
    console.error(
      `version:check failed, ${current} does not exceed ${label} ${baseline}. ` +
        'Run npm version patch --no-git-tag-version before opening the pull request.'
    );
    process.exit(1);
  }

  console.log(`version:check ok, ${current} exceeds ${label} ${baseline}`);
}

function isEntrypoint() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isEntrypoint()) {
  main();
}
