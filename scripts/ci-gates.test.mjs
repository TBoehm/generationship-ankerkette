import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { GATES, JOBS, gatesForJob } from './ci-gates.mjs';

const WORKFLOW_DIR = resolve('.github/workflows');
const workflows = Object.fromEntries(
  readdirSync(WORKFLOW_DIR)
    .filter((f) => f.endsWith('.yml'))
    .map((f) => [f, readFileSync(resolve(WORKFLOW_DIR, f), 'utf8')])
);

function runLines(source) {
  return [...source.matchAll(/^\s*(?:-\s*(?:name:.*\n\s*)?)?run:\s*(.+)$/gm)].map((m) =>
    m[1].trim()
  );
}

describe('gate list', () => {
  it('assigns every gate to a known job', () => {
    for (const gate of GATES) expect(JOBS).toContain(gate.job);
  });

  it('covers every job with at least one gate', () => {
    for (const job of JOBS) expect(gatesForJob(job).length).toBeGreaterThan(0);
  });

  it('returns the full list when no job is given', () => {
    expect(gatesForJob(null)).toHaveLength(GATES.length);
  });

  it('rejects an unknown job instead of running nothing', () => {
    expect(() => gatesForJob('nope')).toThrow(/unknown job/);
  });

  it('partitions the gates, the jobs together are the whole list', () => {
    const viaJobs = JOBS.flatMap((job) => gatesForJob(job).map((g) => g.id));
    expect(viaJobs.sort()).toEqual(GATES.map((g) => g.id).sort());
  });
});

describe('workflow mirror', () => {
  it('finds the workflows it is meant to guard', () => {
    expect(Object.keys(workflows)).toEqual(expect.arrayContaining(['pr.yml', 'deploy.yml']));
  });

  it('runs every job of the pull request workflow through the gate runner', () => {
    const commands = runLines(workflows['pr.yml']);
    const jobs = commands
      .filter((c) => c.includes('npm run qa'))
      .map((c) => c.match(/--job\s+(\S+)/)?.[1]);
    expect(jobs.sort()).toEqual([...JOBS].sort());
  });

  it('runs the full gate set before deploying', () => {
    const commands = runLines(workflows['deploy.yml']);
    expect(commands).toContain('npm run qa');
  });

  it('lets no workflow call a gate directly and walk past the runner', () => {
    const gateScripts = GATES.map((g) => g.args[1]);
    for (const [file, source] of Object.entries(workflows)) {
      for (const command of runLines(source)) {
        if (command.includes('npm run qa')) continue;
        for (const script of gateScripts) {
          expect(command, `${file} runs "${command}", which bypasses the gate runner`).not.toMatch(
            new RegExp(`npm\\s+run\\s+${script.replace(':', '\\:')}\\b`)
          );
        }
      }
    }
  });

  it('pins the same node major the project requires', () => {
    for (const [file, source] of Object.entries(workflows)) {
      expect(source, `${file} does not pin node 22`).toMatch(/node-version:\s*22/);
    }
  });
});
