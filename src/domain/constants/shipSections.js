/**
 * The fifteen sections of the hull, bow first, in the order the index list
 * renders them.
 *
 * Transcribed from the legacy single file draft. Three things were left behind
 * on purpose:
 *
 * - the hex colors, replaced by a stable key that palette.js resolves,
 * - the German names, roles and descriptions, replaced by i18n keys of the
 *   shape `ship.section.<id>.name`, `.role`, `.description`,
 * - every specification line that only restated a figure the design already
 *   fixes or the use cases already derive, such as the ring radius, the spin
 *   rate, the deck count or the deck area.
 *
 * What is left in `figures` is data that exists nowhere else in the domain.
 * The values are numbers, the labels are i18n keys of the shape
 * `ship.figure.<id>`, the units are keys of the shape `units.<id>`, with the
 * empty string for a plain count.
 *
 * Geometry convention: +z points in the flight direction, so the bow has the
 * largest z. An extent runs `from` the stern side edge `to` the bow side edge,
 * hence `from <= to` for all of them.
 */

/**
 * How a section sits in the hull.
 *
 * - inline: one link of the bow to stern chain, it overlaps no other link
 * - internal: inside another section, both rings sit inside the mantle
 * - external: mounted on the outside of a bay it shares the extent with
 * - spanning: runs through the ship, crossing many of the inline links
 */
export const SECTION_PLACEMENT = Object.freeze({
  inline: 'inline',
  internal: 'internal',
  external: 'external',
  spanning: 'spanning',
});

function figure(id, value, unit, { decimals = 0, approximate = false } = {}) {
  return { id, value, unit, decimals, approximate };
}

function makeSection({
  id,
  placement,
  from,
  to,
  colorKey,
  carriesRing = false,
  spinSense = 0,
  figures = [],
}) {
  return Object.freeze({
    id,
    placement,
    z: Object.freeze({ from, to }),
    carriesRing,
    spinSense,
    colorKey,
    figures: Object.freeze(figures.map((entry) => Object.freeze(entry))),
  });
}

export const SHIP_SECTIONS = Object.freeze(
  [
    {
      id: 'bowShield',
      placement: SECTION_PLACEMENT.inline,
      from: 410,
      to: 449,
      colorKey: 'ice',
      figures: [
        figure('frontalArea', 53_100, 'units.squareMetre'),
        figure('iceThickness', 3, 'units.metre'),
        figure('whippleLayers', 4, ''),
        figure('mass', 150_000, 'units.tonne', { approximate: true }),
      ],
    },
    {
      id: 'supplyTanks',
      placement: SECTION_PLACEMENT.inline,
      from: 335,
      to: 405,
      colorKey: 'water',
      figures: [figure('volume', 310_000, 'units.cubicMetre', { approximate: true })],
    },
    {
      id: 'habitatMantle',
      placement: SECTION_PLACEMENT.inline,
      from: 90,
      to: 330,
      colorKey: 'hull',
    },
    {
      id: 'ringA',
      placement: SECTION_PLACEMENT.internal,
      from: 150,
      to: 150,
      colorKey: 'quarters',
      carriesRing: true,
      spinSense: 1,
    },
    {
      id: 'ringB',
      placement: SECTION_PLACEMENT.internal,
      from: 270,
      to: 270,
      colorKey: 'agriculture',
      carriesRing: true,
      spinSense: -1,
      figures: [figure('proteinSources', 4, '')],
    },
    {
      id: 'centralAxis',
      placement: SECTION_PLACEMENT.spanning,
      from: -300,
      to: 450,
      colorKey: 'circulation',
      figures: [figure('diameter', 28, 'units.metre'), figure('spokesPerRing', 6, '')],
    },
    {
      id: 'cryobank',
      placement: SECTION_PLACEMENT.inline,
      from: 48,
      to: 83,
      colorKey: 'reserve',
      figures: [
        figure('donorsMinimum', 3_000, ''),
        figure('donorsMaximum', 5_000, ''),
        figure('storageTemperature', -196, 'units.celsius'),
        figure('depots', 3, ''),
        figure('volume', 30_000, 'units.cubicMetre', { approximate: true }),
      ],
    },
    {
      id: 'workshop',
      placement: SECTION_PLACEMENT.inline,
      from: -15,
      to: 45,
      colorKey: 'technical',
      figures: [
        figure('volume', 100_000, 'units.cubicMetre', { approximate: true }),
        figure('stockMass', 30_000, 'units.tonne', { approximate: true }),
      ],
    },
    {
      id: 'lifeSupport',
      placement: SECTION_PLACEMENT.inline,
      from: -80,
      to: -20,
      colorKey: 'lifeSupport',
      figures: [
        figure('designCapacity', 1_500, 'units.persons'),
        figure('closureMinimum', 99.5, 'units.percent', { decimals: 1 }),
        figure('autonomy', 180, 'units.day'),
      ],
    },
    {
      id: 'reactor',
      placement: SECTION_PLACEMENT.inline,
      from: -155,
      to: -85,
      colorKey: 'power',
      figures: [
        figure('continuousPower', 300, 'units.megawatt', { approximate: true }),
        figure('reactorUnits', 2, ''),
      ],
    },
    {
      id: 'radiators',
      placement: SECTION_PLACEMENT.external,
      from: -155,
      to: -85,
      colorKey: 'thermal',
      figures: [
        figure('area', 24_000, 'units.squareMetre', { approximate: true }),
        figure('temperature', 450, 'units.kelvin', { approximate: true }),
        figure('segments', 8, ''),
      ],
    },
    {
      id: 'shadowShield',
      placement: SECTION_PLACEMENT.inline,
      from: -160,
      to: -160,
      colorKey: 'shielding',
      figures: [figure('diameter', 124, 'units.metre'), figure('thickness', 6, 'units.metre')],
    },
    {
      id: 'propellantMagazine',
      placement: SECTION_PLACEMENT.inline,
      from: -260,
      to: -170,
      colorKey: 'propellant',
    },
    {
      id: 'propulsion',
      placement: SECTION_PLACEMENT.inline,
      from: -320,
      to: -260,
      colorKey: 'propulsion',
      figures: [
        figure('pusherPlateDiameter', 210, 'units.metre'),
        figure('exhaustVelocity', 1_000, 'units.kilometrePerSecond', { approximate: true }),
      ],
    },
    {
      id: 'magsail',
      placement: SECTION_PLACEMENT.inline,
      from: -335,
      to: -335,
      colorKey: 'magsail',
      figures: [figure('diameter', 380, 'units.metre')],
    },
  ].map(makeSection)
);
