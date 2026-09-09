import * as THREE from 'three';
import { MISSION } from '../../../domain/constants/missionProfile.js';
import { DESTINATIONS } from '../../../domain/constants/starSystem.js';
import { flightStateAt } from '../../../domain/usecases/flightState.js';
import {
  displayRadius,
  warpFactor,
  warpLength,
  warpParameters,
} from '../../../domain/usecases/spatialWarp.js';
import { FLY_TO_DURATION_MS, flyProgress, mix } from '../../../domain/usecases/cameraFlight.js';
import {
  createOrbitState,
  orbitAfterDrag,
  orbitAfterZoom,
} from '../../../domain/usecases/cameraOrbit.js';
import { apparentMagnitude } from '../../../domain/usecases/photometry.js';
import { pathPositionAt } from '../../../domain/usecases/flightGeometry.js';
import { createDisposalRegistry } from '../disposal.js';
import { createResources } from './resources.js';
import { toScene } from './coordinates.js';
import { PROXIMA_POSITION, SUN_POSITION } from './layout.js';
import { lightColor } from './palette.js';
import { createBodies, moveBodies } from './bodies.js';
import { createFields, warpFields } from './fields.js';
import { createTraces, warpTraces } from './traces.js';
import {
  PLUME_OPACITY,
  PLUME_PULSE_RATE,
  SAIL_OPACITY,
  SAIL_PULSE_RATE,
  createShipProxy,
  spinRings,
} from './shipProxy.js';
import {
  DEFAULT_CAMERA_MODE,
  INITIAL_ORBIT,
  INITIAL_SYSTEM_DISTANCE,
  SYSTEM_SHIP_SCALE,
  createFlightCamera,
  isCameraMode,
  limitsFor,
  FOCUS_ORBIT_LIMITS,
  INITIAL_FOCUS_DISTANCE,
  NEAR_PLANE,
  orbitsAroundTarget,
  placeCamera,
} from './camera.js';
import { PICK_ANGLE, createPicker } from './picking.js';

/**
 * The journey from the departure orbit to proxima b, as one scene the stage
 * owns. It creates no renderer, runs no loop and listens to nothing: it is
 * handed a frame, a distance and a pointer gesture, and it answers with an
 * object tree and a list of label positions.
 *
 * Everything follows from `setDistance`. The distance gives the mission time,
 * the mission time gives every planet its phase, the distance gives the
 * reference length of the compression, and the distance from the ship to each
 * star gives its brightness. There is no second source of truth and no clock.
 */
const AMBIENT_INTENSITY = 0.72;
const SUN_LIGHT = { intensity: 3, minimum: 0.06, maximum: 2.2, minimumRange: 0.4 };
const PROXIMA_LIGHT = { intensity: 0.05, maximum: 2, minimumRange: 0.02 };
const CAMERA_LIGHT_INTENSITY = 0.5;

/** Exaggeration of the body sizes in system view, where scale is pinned. */
const SYSTEM_BODY_SCALE = 0.9;
const SMALLEST_BODY_SCALE = 1e-5;
const SMALLEST_WARPED_LENGTH = 1e-4;

/** Star glow, sized and dimmed from the apparent magnitude. */
const STAR_GLOW = { scale: 24, exponent: -0.12, offset: 5, min: 2, max: 30 };
const STAR_GLOW_OPACITY = { offset: 1, span: 12, min: 0.1, max: 1 };
/** Planet glow, sized from the angular radius and dimmed with distance. */
const PLANET_GLOW = { scale: 5000, min: 1.8, max: 9, range: 5000 };
const PLANET_GLOW_OPACITY = { offset: 1.4, span: 70, min: 0.1, max: 0.85 };

/** How far outside the frame a label may sit before it is dropped. */
const LABEL_MARGIN = 1.05;

const HALF_DISTANCE = MISSION.totalDistance / 2;
const BRAKING_START = MISSION.totalDistance - MISSION.brakingDistance;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createFlightScene({
  registry = createDisposalRegistry(),
  random = Math.random,
  reducedMotion = false,
} = {}) {
  const resources = createResources(registry);
  // No background colour on purpose. A scene background forces a clear in
  // r128 even with autoClear off, which would wipe the pass drawn before it
  // and take the crossfade with it. The backdrop is the clear colour.
  const root = new THREE.Scene();
  root.name = 'flight';
  const camera = createFlightCamera();

  const ambientLight = new THREE.AmbientLight(lightColor('ambient'), AMBIENT_INTENSITY);
  const sunLight = new THREE.PointLight(lightColor('sun'), SUN_LIGHT.intensity, 0);
  const proximaLight = new THREE.PointLight(lightColor('proxima'), 0, 0);
  const cameraLight = new THREE.DirectionalLight(lightColor('camera'), CAMERA_LIGHT_INTENSITY);
  root.add(ambientLight, sunLight, proximaLight, cameraLight);

  const { group: fieldGroup, fields } = createFields(resources, random);
  const { group: traceGroup, traces } = createTraces(resources);
  const { group: bodyGroup, bodies } = createBodies(resources);
  const proxy = createShipProxy(resources);
  root.add(fieldGroup, traceGroup, bodyGroup, proxy.group);

  const heading = toScene(DESTINATIONS.proxima.direction).normalize();
  proxy.group.lookAt(heading);

  /**
   * The ship is a pick target of its own. Circling a planet is a one way trip
   * otherwise: the only way back is the button in the dock, and the obvious
   * gesture, tapping the ship, would do nothing.
   */
  const ORIGIN = new THREE.Vector3(0, 0, 0);
  /**
   * How much room to leave between the eye and what it is looking at, and how
   * close the near plane may ever come. Twenty is enough that a body fills the
   * frame without its own front face being cut off, and the floor keeps the
   * depth buffer from collapsing on the smallest world in the set.
   */
  const NEAR_PLANE_MARGIN = 20;
  const MIN_NEAR_PLANE = 1e-7;
  const SHIP_TARGET = { kind: 'ship' };
  const bodyById = new Map(bodies.map((body) => [body.id, body]));
  const pickTargets = new Map();
  for (const body of bodies) {
    pickTargets.set(body.mesh, body);
    pickTargets.set(body.glow, body);
  }
  proxy.group.traverse((object) => {
    if (object.isMesh) pickTargets.set(object, SHIP_TARGET);
  });
  pickTargets.set(proxy.marker, SHIP_TARGET);

  /**
   * An orbit stands in for the planet that runs it. At true sizes a planet is
   * far below a pixel, and its orbit is then the only thing left on screen
   * large enough to aim at.
   */
  traceGroup.traverse((object) => {
    if (!object.name.startsWith('orbit-')) return;
    const body = bodyById.get(object.name.slice('orbit-'.length));
    if (body) pickTargets.set(object, body);
  });
  const pickable = [...pickTargets.keys()];
  const pick = createPicker();

  const sunPosition = toScene(SUN_POSITION);
  const proximaPosition = toScene(PROXIMA_POSITION);
  const shipPosition = new THREE.Vector3();
  const warpCentre = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const projected = new THREE.Vector3();

  const viewport = { width: 0, height: 0 };
  let mode = DEFAULT_CAMERA_MODE;
  let orbit = createOrbitState(INITIAL_ORBIT, limitsFor('chase'));
  let systemOrbit = createOrbitState(
    { ...INITIAL_ORBIT, distance: INITIAL_SYSTEM_DISTANCE },
    limitsFor('system')
  );
  let focusBodyId = null;
  /** An approach in progress: where the eye came from, and how far along. */
  let flyTo = null;
  const flyFrom = new THREE.Vector3();
  const eyeTarget = new THREE.Vector3();
  let focusOrbit = createOrbitState(
    { ...INITIAL_ORBIT, distance: INITIAL_FOCUS_DISTANCE },
    FOCUS_ORBIT_LIMITS
  );
  let distance = MISSION.startDistance;
  let boostSizes = true;
  let showLabels = true;
  let elapsed = 0;
  let labelList = [];

  const focusedBody = () =>
    focusBodyId && orbitsAroundTarget(mode) ? (bodyById.get(focusBodyId) ?? null) : null;
  const activeOrbit = () => (focusedBody() ? focusOrbit : mode === 'system' ? systemOrbit : orbit);

  /** The dolly distance in scene units, whatever it is being measured in. */
  function eyeDistance() {
    const body = focusedBody();
    return body ? focusOrbit.distance * body.mesh.scale.x : activeOrbit().distance;
  }

  /** Begin an approach from wherever the eye stands to the new subject. */
  function startFlight() {
    if (reducedMotion) {
      flyTo = null;
      return;
    }
    const body = focusedBody();
    flyFrom.copy(body ? body.mesh.position : ORIGIN);
    if (flyTo) flyFrom.copy(eyeTarget);
    flyTo = { elapsed: 0, fromDistance: eyeDistance() };
  }

  /**
   * The threshold a point has to come within to count as tapped. It is an
   * angle, so it has to be turned into a world distance at the range of the
   * thing being tapped. While a planet is circled the eye sits a few planet
   * radii away but the ship is far behind it, and a threshold measured on the
   * near distance would never reach the ship's mark.
   */
  function pickThreshold() {
    const reach = focusedBody()
      ? Math.max(eyeDistance(), camera.position.distanceTo(proxy.group.position))
      : eyeDistance();
    return PICK_ANGLE * reach;
  }

  function aim() {
    proxy.group.visible = orbitsAroundTarget(mode);
    const body = focusedBody();
    // The mark stands in for the ship whenever the camera is looking at
    // something else, which is exactly when the ship is too far off to tap.
    proxy.marker.visible = body !== null;

    // While a body is circled the dolly counts its radii, so the eye keeps the
    // same distance from it however far the warp has stretched the space
    // around it.
    const destination = body ? body.mesh.position : ORIGIN;
    const reach = body ? focusOrbit.distance * body.mesh.scale.x : activeOrbit().distance;

    let target = destination;
    let distance = reach;
    if (flyTo) {
      const t = flyProgress(flyTo.elapsed, { reducedMotion });
      eyeTarget.lerpVectors(flyFrom, destination, t);
      target = eyeTarget;
      distance = mix(flyTo.fromDistance, reach, t);
    }

    // The dolly counts radii of the subject, so the angle it subtends is
    // atan(1 / distance) whatever size it is drawn at: the toggle cannot
    // change how large it looks. What it does change is how near the eye
    // stands in scene units, and a body at its true size puts the eye well
    // inside the default near plane, which would clip the whole scene away.
    camera.near = Math.min(NEAR_PLANE, Math.max(MIN_NEAR_PLANE, distance / NEAR_PLANE_MARGIN));
    camera.updateProjectionMatrix();

    placeCamera(camera, {
      mode,
      orbit: { ...(body ? focusOrbit : activeOrbit()), distance },
      heading,
      target,
    });
    if (camera.position.lengthSq() > 0) {
      cameraLight.position.copy(camera.position).normalize();
    } else {
      camera.getWorldDirection(cameraLight.position).negate();
    }
  }

  /** Warp one true position into the compressed scene, in place. */
  function warpPosition(target, position, parameters) {
    offset.copy(position).sub(warpCentre);
    return target.copy(offset).multiplyScalar(warpFactor(offset.length(), parameters));
  }

  function updateBody(body, parameters, inSystem) {
    offset.copy(body.position).sub(warpCentre);
    const trueLength = offset.length();
    const factor = warpFactor(trueLength, parameters);
    body.mesh.position.copy(offset).multiplyScalar(factor);
    body.glow.position.copy(body.mesh.position);

    const fromShip = body.position.distanceTo(shipPosition);
    const shown = displayRadius(
      body.radiusAu,
      fromShip,
      Math.max(trueLength * factor, SMALLEST_WARPED_LENGTH),
      boostSizes
    );
    // System view pins the scale, so a body is not drawn at its angular size
    // from the ship. Emphasised means the cube root of the volume ratio, which
    // keeps Mercury visible next to Jupiter.
    //
    // True means the warped thickness of the body's own radius where it
    // stands: how much of the compressed scene it actually occupies. That is
    // the only honest answer here, because it is the one that holds the body
    // against its own orbit, and against the orbits it is drawn among. A ratio
    // between the planets says nothing about that, which is why the earlier
    // two attempts, anchored first on Earth and then on the largest planet,
    // both came out far too large.
    const systemScale = boostSizes
      ? SYSTEM_BODY_SCALE * body.cubeRadius
      : warpLength(trueLength + body.radiusAu, parameters) - warpLength(trueLength, parameters);
    body.mesh.scale.setScalar(inSystem ? systemScale : Math.max(shown, SMALLEST_BODY_SCALE));

    if (body.absoluteMagnitude !== null) {
      const magnitude = apparentMagnitude(body.absoluteMagnitude, fromShip);
      body.glow.visible = true;
      body.glow.material.size = clamp(
        STAR_GLOW.scale * Math.pow(10, STAR_GLOW.exponent * (magnitude + STAR_GLOW.offset)),
        STAR_GLOW.min,
        STAR_GLOW.max
      );
      resources.setBase(
        body.glow.material,
        clamp(
          1 - (magnitude - STAR_GLOW_OPACITY.offset) / STAR_GLOW_OPACITY.span,
          STAR_GLOW_OPACITY.min,
          STAR_GLOW_OPACITY.max
        )
      );
      return;
    }
    body.glow.visible = fromShip < PLANET_GLOW.range;
    body.glow.material.size = clamp(
      (body.radiusAu / Math.max(fromShip, 1e-9)) * PLANET_GLOW.scale,
      PLANET_GLOW.min,
      PLANET_GLOW.max
    );
    resources.setBase(
      body.glow.material,
      clamp(
        PLANET_GLOW_OPACITY.offset - fromShip / PLANET_GLOW_OPACITY.span,
        PLANET_GLOW_OPACITY.min,
        PLANET_GLOW_OPACITY.max
      )
    );
  }

  function rebuild() {
    const parameters = warpParameters(distance, mode);
    const state = flightStateAt(distance);
    // The orbits are phased from the cast off, the flight clock from the
    // first pulse of the drive. They differ by the 1.5 years of the tow.
    moveBodies(bodies, state.missionTime - MISSION.towDuration);

    toScene(pathPositionAt(distance), shipPosition);
    const inSystem = mode === 'system';
    if (inSystem) {
      warpCentre.copy(distance <= HALF_DISTANCE ? sunPosition : proximaPosition);
    } else {
      warpCentre.copy(shipPosition);
    }

    warpPosition(proxy.group.position, shipPosition, parameters);
    proxy.group.scale.setScalar(inSystem ? SYSTEM_SHIP_SCALE : 1);

    warpPosition(sunLight.position, sunPosition, parameters);
    sunLight.intensity = clamp(
      SUN_LIGHT.intensity / Math.max(shipPosition.length(), SUN_LIGHT.minimumRange),
      SUN_LIGHT.minimum,
      SUN_LIGHT.maximum
    );
    warpPosition(proximaLight.position, proximaPosition, parameters);
    proximaLight.intensity = clamp(
      PROXIMA_LIGHT.intensity /
        Math.max(shipPosition.distanceTo(proximaPosition), PROXIMA_LIGHT.minimumRange),
      0,
      PROXIMA_LIGHT.maximum
    );

    for (const body of bodies) updateBody(body, parameters, inSystem);
    warpFields(fields, warpCentre, parameters);
    warpTraces(traces, warpCentre, parameters);

    proxy.plume.visible = distance < MISSION.accelerationDistance;
    proxy.sail.visible = distance > BRAKING_START;
    // A circled body moves: the planets run their orbits and the warp shifts
    // the whole field as the ship advances. The eye has to follow it, or the
    // planet drifts out from under the camera during playback.
    if (focusBodyId) aim();
  }

  /**
   * Where each name belongs on the screen, in CSS pixels. The scene projects
   * and the view draws, so no element is created, measured or moved here.
   */
  function projectLabels() {
    if (!showLabels || resources.opacity() <= 0) return [];
    const list = [];
    for (const body of bodies) {
      projected.copy(body.mesh.position).project(camera);
      const inFrame =
        projected.z < 1 &&
        Math.abs(projected.x) < LABEL_MARGIN &&
        Math.abs(projected.y) < LABEL_MARGIN;
      if (!inFrame) continue;
      list.push({
        id: body.id,
        nameKey: body.nameKey,
        x: (projected.x * 0.5 + 0.5) * viewport.width,
        y: (-projected.y * 0.5 + 0.5) * viewport.height,
      });
    }
    return list;
  }

  aim();
  rebuild();

  return {
    root,
    camera,

    setOpacity(value) {
      resources.setOpacity(value);
    },

    update(deltaMs) {
      const seconds = Math.max(0, deltaMs) / 1000;
      elapsed += seconds;
      if (flyTo) {
        flyTo.elapsed += Math.max(0, deltaMs);
        if (flyTo.elapsed >= FLY_TO_DURATION_MS) flyTo = null;
        aim();
      }
      spinRings(proxy, seconds);
      if (proxy.plume.visible) {
        resources.setBase(
          proxy.plumeMaterial,
          PLUME_OPACITY.base + PLUME_OPACITY.swing * Math.sin(elapsed * PLUME_PULSE_RATE)
        );
      }
      if (proxy.sail.visible) {
        resources.setBase(
          proxy.sailMaterial,
          SAIL_OPACITY.base + SAIL_OPACITY.swing * Math.sin(elapsed * SAIL_PULSE_RATE)
        );
      }
      labelList = projectLabels();
      return labelList;
    },

    /** The label positions of the last frame, for the view to draw. */
    labels() {
      return labelList;
    },

    handleDrag(dx, dy) {
      if (focusedBody()) {
        focusOrbit = orbitAfterDrag(focusOrbit, dx, dy, FOCUS_ORBIT_LIMITS);
        aim();
        return;
      }
      if (mode === 'system') {
        systemOrbit = orbitAfterDrag(systemOrbit, dx, dy, limitsFor('system'));
        orbit = { ...orbit, theta: systemOrbit.theta, phi: systemOrbit.phi };
      } else {
        orbit = orbitAfterDrag(orbit, dx, dy, limitsFor(mode));
        systemOrbit = { ...systemOrbit, theta: orbit.theta, phi: orbit.phi };
      }
      aim();
    },

    handleZoom(factor) {
      if (focusedBody()) {
        focusOrbit = orbitAfterZoom(focusOrbit, factor, FOCUS_ORBIT_LIMITS);
        aim();
        return;
      }
      if (mode === 'system') {
        systemOrbit = orbitAfterZoom(systemOrbit, factor, limitsFor('system'));
      } else {
        orbit = orbitAfterZoom(orbit, factor, limitsFor(mode));
      }
      aim();
    },

    handleTap(x, y, onSelect) {
      root.updateMatrixWorld(true);
      const hit = pick({
        x,
        y,
        viewport,
        camera,
        root,
        targets: pickable,
        threshold: pickThreshold(),
      });
      const target = hit && pickTargets.get(hit);
      if (!target) return;
      if (target === SHIP_TARGET) onSelect(SHIP_TARGET);
      else onSelect({ kind: 'body', id: target.id, nameKey: target.nameKey });
    },

    /**
     * Circle a body instead of the ship. An unknown id, or null, releases it.
     * Returns whether anything is being circled afterwards, so the caller can
     * tell a rejected id from an accepted one.
     */
    setFocusBody(id) {
      const next = id && bodyById.has(id) ? id : null;
      if (next === focusBodyId) return next !== null;
      startFlight();
      focusBodyId = next;
      if (next) {
        focusOrbit = createOrbitState(
          { theta: orbit.theta, phi: orbit.phi, distance: INITIAL_FOCUS_DISTANCE },
          FOCUS_ORBIT_LIMITS
        );
      }
      // The subject decides how large it is drawn, so the sizes are settled
      // before the eye is placed against them. rebuild only re-aims while
      // something is being circled, so letting go needs the explicit call.
      rebuild();
      aim();
      return next !== null;
    },

    focusBody: () => focusBodyId,

    setDistance(au) {
      if (!Number.isFinite(au)) return;
      distance = clamp(au, 0, MISSION.totalDistance);
      rebuild();
    },

    setCameraMode(next) {
      if (!isCameraMode(next) || next === mode) return;
      mode = next;
      aim();
      rebuild();
    },

    setBoostSizes(on) {
      boostSizes = Boolean(on);
      rebuild();
    },

    setShowLabels(on) {
      showLabels = Boolean(on);
      if (!showLabels) labelList = [];
    },

    resize(width, height) {
      if (!width || !height) return;
      viewport.width = width;
      viewport.height = height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    dispose() {
      registry.disposeAll();
      root.clear();
      pickTargets.clear();
      pickable.length = 0;
      bodies.length = 0;
      fields.length = 0;
      traces.length = 0;
      labelList = [];
    },
  };
}
