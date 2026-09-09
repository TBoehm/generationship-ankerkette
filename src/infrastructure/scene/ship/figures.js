import { SHIP_SECTIONS } from '../../../domain/constants/shipSections.js';

/**
 * The section table carries the figures the design fixes, such as the
 * diameter of the shadow shield or the number of Whipple layers on the bow.
 * Reading the drawing off those figures instead of off a second set of
 * numbers here means the picture cannot drift away from the data.
 */
export function sectionById(id) {
  return SHIP_SECTIONS.find((section) => section.id === id);
}

export function figureValue(section, id, fallback) {
  return section?.figures.find((figure) => figure.id === id)?.value ?? fallback;
}

/** Midpoint of a section along the flight axis, in metres. */
export function centerZ(section) {
  return (section.z.from + section.z.to) / 2;
}

/** Extent of a section along the flight axis, in metres. */
export function lengthZ(section) {
  return section.z.to - section.z.from;
}
