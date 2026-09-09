import { describe, expect, it } from 'vitest';
import {
  BODY_COLORS,
  EMISSIVE_COLORS,
  bodyColor,
  emissiveColor,
  fieldColor,
  lightColor,
  proxyColor,
  traceColor,
} from './palette.js';
import { SECTION_COLORS } from '../palette.js';
import { PLANETS, PX_PLANETS, STARS } from '../../../domain/constants/starSystem.js';

const everyBody = [...PLANETS, ...PX_PLANETS, ...Object.values(STARS)];

describe('body colours', () => {
  it('paints every body the star table carries', () => {
    for (const body of everyBody) {
      expect(BODY_COLORS[body.colorKey]).toBeTypeOf('number');
    }
  });

  it('carries no colour for a body that was disproved', () => {
    expect(BODY_COLORS).not.toHaveProperty('proximaC');
  });

  it('falls back rather than painting undefined', () => {
    expect(bodyColor('nothing')).toBeTypeOf('number');
  });

  it('lets only the stars emit, a planet has nothing of its own', () => {
    for (const body of everyBody) {
      const emits = emissiveColor(body.colorKey) !== null;
      expect(emits).toBe(body.absoluteMagnitude !== null);
    }
    expect(Object.keys(EMISSIVE_COLORS)).toHaveLength(4);
  });
});

describe('field, trace and light colours', () => {
  it('answers with a number for a known key and for an unknown one', () => {
    expect(fieldColor('heliosphere')).toBeTypeOf('number');
    expect(fieldColor('nothing')).toBeTypeOf('number');
    expect(traceColor('flightPath')).toBeTypeOf('number');
    expect(traceColor('nothing')).toBeTypeOf('number');
    expect(lightColor('sun')).toBeTypeOf('number');
    expect(lightColor('nothing')).toBeTypeOf('number');
  });
});

describe('proxy colours', () => {
  it('takes the sections from the shared table rather than restating them', () => {
    expect(proxyColor('quarters')).toBe(SECTION_COLORS.quarters);
    expect(proxyColor('magsail')).toBe(SECTION_COLORS.magsail);
    expect(proxyColor('power')).toBe(SECTION_COLORS.power);
  });

  it('adds the one colour the hull view has no use for', () => {
    expect(proxyColor('exhaust')).toBeTypeOf('number');
    expect(SECTION_COLORS).not.toHaveProperty('exhaust');
  });

  it('falls back to the hull', () => {
    expect(proxyColor('nothing')).toBe(SECTION_COLORS.hull);
  });
});
