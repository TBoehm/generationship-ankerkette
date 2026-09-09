import { describe, expect, it } from 'vitest';
import { chooseBaseline, isGreater, parseVersion } from './version-check.mjs';

describe('parseVersion', () => {
  it('accepts a three part version', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
  });

  it('rejects anything that is not semver', () => {
    expect(parseVersion('1.2')).toBeNull();
    expect(parseVersion('1.2.3-rc1')).toBeNull();
    expect(parseVersion('v1.2.3')).toBeNull();
  });
});

describe('isGreater', () => {
  it('compares by precedence, not lexically', () => {
    expect(isGreater([0, 10, 0], [0, 9, 0])).toBe(true);
    expect(isGreater([1, 0, 0], [0, 99, 99])).toBe(true);
  });

  it('is false for an equal version', () => {
    expect(isGreater([0, 1, 2], [0, 1, 2])).toBe(false);
  });

  it('is false for an older version', () => {
    expect(isGreater([0, 1, 1], [0, 1, 2])).toBe(false);
  });
});

describe('chooseBaseline', () => {
  it('compares a feature branch against the version published on main', () => {
    const choice = chooseBaseline({
      onMain: false,
      releasedVersion: '0.1.0',
      mainVersion: '0.1.2',
    });
    expect(choice.baseline).toBe('0.1.2');
    expect(choice.label).toMatch(/main/);
  });

  it('compares main against the last release, never against itself', () => {
    const choice = chooseBaseline({ onMain: true, releasedVersion: '0.1.1', mainVersion: '0.1.2' });
    expect(choice.baseline).toBe('0.1.1');
    expect(choice.label).toMatch(/release/);
  });

  it('skips on main while nothing has been released yet', () => {
    const choice = chooseBaseline({ onMain: true, releasedVersion: null, mainVersion: '0.1.2' });
    expect(choice.baseline).toBeNull();
  });

  it('skips on a branch while main carries no package.json yet', () => {
    const choice = chooseBaseline({ onMain: false, releasedVersion: null, mainVersion: null });
    expect(choice.baseline).toBeNull();
  });

  it('never hands main its own version as the baseline', () => {
    const choice = chooseBaseline({ onMain: true, releasedVersion: '0.1.1', mainVersion: '0.1.2' });
    expect(choice.baseline).not.toBe('0.1.2');
  });
});
