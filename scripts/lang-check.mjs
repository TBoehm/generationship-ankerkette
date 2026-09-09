import { globSync, readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Code, identifiers and comments are English everywhere. German belongs in
 * the user interface, and the user interface reaches the code only through
 * src/locales, never as a literal.
 *
 * Two signals: umlauts and the sharp s, which no English word carries, and
 * a list of German function words that survive without them. Words that
 * exist in both languages, "die" and "man" above all, stay out of the list
 * so English prose is never flagged.
 */
// prettier-ignore
const GERMAN_WORDS = 'aber alle auch dann das dem den der diese eine einen einer ist jede jeder kein keine nicht oder sind soll und werden wenn wird zwischen'.split(' '); // lang-check-ignore

const WORD_PATTERN = new RegExp(`\\b(${GERMAN_WORDS.join('|')})\\b`, 'i');
const UMLAUT_PATTERN = /[äöüÄÖÜß]/; // lang-check-ignore
const OPT_OUT = 'lang-check-ignore';

export function findGermanIn(source) {
  const hits = [];
  source.split('\n').forEach((text, index) => {
    if (text.includes(OPT_OUT)) return;
    if (UMLAUT_PATTERN.test(text)) {
      hits.push({ line: index + 1, text: text.trim(), reason: 'umlaut or sharp s' });
      return;
    }
    const word = text.match(WORD_PATTERN);
    if (word) {
      hits.push({ line: index + 1, text: text.trim(), reason: `German word "${word[1]}"` });
    }
  });
  return hits;
}

const PATTERNS = [
  'src/**/*.js',
  'src/**/*.jsx',
  'src/**/*.css',
  'scripts/**/*.mjs',
  '*.js',
  'index.html',
];
const EXCLUDED = /^src\/locales\//;

export function collectFiles() {
  return PATTERNS.flatMap((pattern) => globSync(pattern)).filter((file) => !EXCLUDED.test(file));
}

function main() {
  const problems = [];
  for (const file of collectFiles()) {
    for (const hit of findGermanIn(readFileSync(file, 'utf8'))) {
      problems.push(`${file}:${hit.line}  ${hit.reason}\n      ${hit.text}`);
    }
  }

  if (problems.length) {
    console.error(`lang:check failed, ${problems.length} line(s) are not English:`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error('\nGerman belongs in src/locales. Add lang-check-ignore to a line that is a');
    console.error('deliberate exception, such as an assertion against rendered German copy.');
    process.exit(1);
  }

  console.log(`lang:check ok, ${collectFiles().length} files are English`);
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
