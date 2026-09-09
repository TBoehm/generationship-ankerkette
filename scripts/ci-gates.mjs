#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The gate list lives here as code, not as a description someone keeps in
 * step by hand. The Actions workflow calls this same runner, and
 * ci-gates.test.mjs turns red the moment a pipeline job walks past it.
 *
 * Every gate runs even after an earlier one failed: a red run names all its
 * findings at once instead of one per round trip.
 */
export const JOBS = ['checks', 'test', 'build'];

export const GATES = [
  { id: 'format:check', job: 'checks', command: 'npm', args: ['run', 'format:check'] },
  { id: 'lint', job: 'checks', command: 'npm', args: ['run', 'lint'] },
  { id: 'i18n:check', job: 'checks', command: 'npm', args: ['run', 'i18n:check'] },
  { id: 'lang:check', job: 'checks', command: 'npm', args: ['run', 'lang:check'] },
  { id: 'version:check', job: 'checks', command: 'npm', args: ['run', 'version:check'] },
  { id: 'test:ci', job: 'test', command: 'npm', args: ['run', 'test:ci'] },
  { id: 'build', job: 'build', command: 'npm', args: ['run', 'build'] },
  { id: 'pages:check', job: 'build', command: 'npm', args: ['run', 'pages:check'] },
];

export function gatesForJob(job) {
  if (!job) return GATES;
  if (!JOBS.includes(job))
    throw new Error(`unknown job "${job}", expected one of ${JOBS.join(', ')}`);
  return GATES.filter((gate) => gate.job === job);
}

function parseJob(argv) {
  const index = argv.indexOf('--job');
  return index === -1 ? null : argv[index + 1];
}

function main() {
  const job = parseJob(process.argv.slice(2));
  let gates;
  try {
    gates = gatesForJob(job);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  const results = [];
  for (const gate of gates) {
    console.log(`\n── ${gate.id}`);
    const run = spawnSync(gate.command, gate.args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    results.push({ id: gate.id, ok: run.status === 0 });
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n── summary${job ? ` (job ${job})` : ''}`);
  for (const result of results) console.log(`  ${result.ok ? 'pass' : 'FAIL'}  ${result.id}`);

  if (failed.length) {
    console.error(`\n${failed.length} of ${results.length} gates failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} gates passed.`);
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
