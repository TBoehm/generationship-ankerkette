import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * GitHub Pages breaks in ways a local dev server never shows: a wrong base
 * turns every asset into a 404, a missing 404.html turns every reload on a
 * deep link into one, and Jekyll silently eats directories that start with
 * an underscore. This checks the built output for exactly those.
 */
const DIST = resolve('dist');
const BASE = '/generationship-ankerkette/';
const problems = [];

if (!existsSync(DIST)) {
  console.error('pages:check failed, dist/ is missing. Run npm run build first.');
  process.exit(1);
}

const indexPath = resolve(DIST, 'index.html');
if (!existsSync(indexPath)) {
  problems.push('dist/index.html is missing');
} else {
  const index = readFileSync(indexPath, 'utf8');
  const references = [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const local = references.filter((r) => !/^(https?:)?\/\//.test(r) && !r.startsWith('data:'));

  if (!local.length) problems.push('dist/index.html references no local asset at all');
  for (const reference of local) {
    if (!reference.startsWith(BASE)) {
      problems.push(`asset "${reference}" does not start with the Pages base ${BASE}`);
    }
  }

  const fallbackPath = resolve(DIST, '404.html');
  if (!existsSync(fallbackPath)) {
    problems.push('dist/404.html is missing, a reload on a deep link would 404');
  } else if (readFileSync(fallbackPath, 'utf8') !== index) {
    problems.push('dist/404.html is not a copy of dist/index.html');
  }
}

const LEGACY = [
  'generationenschiff-grundriss.html',
  'flug-3d-proxima.html',
  'flugbahn-alpha-centauri.html',
];
for (const document of LEGACY) {
  if (!existsSync(resolve(DIST, 'legacy', document))) {
    problems.push(`dist/legacy/${document} is missing, the view linking to it would 404`);
  }
}

if (!existsSync(resolve(DIST, '.nojekyll'))) {
  problems.push('dist/.nojekyll is missing, Jekyll would drop underscore directories');
}

if (problems.length) {
  console.error(`pages:check failed, ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`pages:check ok, base ${BASE}, 404 fallback and .nojekyll in place`);
