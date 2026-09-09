import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['de', 'en'];
const REFERENCE = 'de';

function flatten(value, prefix, out) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }
  out.set(prefix, value);
  return out;
}

function load(locale) {
  const file = resolve(ROOT, 'src/locales', `${locale}.json`);
  return flatten(JSON.parse(readFileSync(file, 'utf8')), '', new Map());
}

const tables = Object.fromEntries(LOCALES.map((l) => [l, load(l)]));
const reference = tables[REFERENCE];
const problems = [];

for (const [key, value] of reference) {
  if (typeof value !== 'string' || value.trim() === '') {
    problems.push(`${REFERENCE}: "${key}" is empty, German carries no fallback`);
  }
}

for (const locale of LOCALES.filter((l) => l !== REFERENCE)) {
  const table = tables[locale];
  for (const key of reference.keys()) {
    if (!table.has(key)) problems.push(`${locale}: missing "${key}"`);
  }
  for (const [key, value] of table) {
    if (!reference.has(key)) problems.push(`${locale}: "${key}" has no ${REFERENCE} counterpart`);
    else if (typeof value !== 'string' || value.trim() === '')
      problems.push(`${locale}: "${key}" is empty`);
  }
}

if (problems.length) {
  console.error(`i18n parity failed, ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`i18n parity ok, ${reference.size} keys across ${LOCALES.join(', ')}`);
