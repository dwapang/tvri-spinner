/**
 * Realistic pointer flapper physics simulation.
 * Pure, deterministic damped spring model with peg collision detection.
 */

export interface PointerPhysicsConfig {
  /** Natural spring stiffness k (omega_n^2). Default 900 (omega_n = 30 rad/s) */
  k: number;
  /** Damping coefficient c (2 * zeta * omega_n). Default 21 (zeta = 0.35) */
  c: number;
  /** Maximum pointer deflection in radians. 30 degrees = ~0.5236 rad */
  maxDeflection: number;
  /** Maximum angular velocity cap in rad/s */
  maxOmega: number;
  /** Fixed integration substep in seconds (1/240s) */
  substep: number;
  /** Maximum frame delta allowed in ms before clamping */
  maxFrameDeltaMs: number;
  /** Tip length in pixels for peg engagement calculation */
  tipLengthPx: number;
  /** Fast regime threshold in boundaries/second */
  fastRegimeBps: number;
  /** Slow regime threshold in boundaries/second */
  slowRegimeBps: number;
  /** Rest angle epsilon in radians to consider settled */
  restThetaEpsilon: number;
  /** Rest angular velocity epsilon in rad/s to consider settled */
  restOmegaEpsilon: number;
}

export const POINTER_CONFIG: PointerPhysicsConfig = {
  k: 900,
  c: 21,
  maxDeflection: (30 * Math.PI) / 180, // ~0.5236 rad
  maxOmega: 20, // rad/s
  substep: 1 / 240, // 4.167ms
  maxFrameDeltaMs: 50,
  tipLengthPx: 24,
  fastRegimeBps: 40,
  slowRegimeBps: 8,
  restThetaEpsilon: 0.015,
  restOmegaEpsilon: 0.1,
};

export interface PointerState {
  /** Angular position in radians (positive = clockwise / right) */
  theta: number;
  /** Angular velocity in rad/s */
  omega: number;
  /** Whether a peg is currently actively engaging the flapper */
  isPegEngaged: boolean;
  /** Filtered boundaries-per-second estimate */
  bpsFiltered: number;
}

export function createInitialPointerState(): PointerState {
  return {
    theta: 0,
    omega: 0,
    isPegEngaged: false,
    bpsFiltered: 0,
  };
}

/**
 * Steps the damped spring physics forward by dt seconds under free or peg-forced motion.
 * theta'' = -k*theta - c*theta'
 */
export function stepDampedSpring(
  state: PointerState,
  dt: number,
  config = POINTER_CONFIG,
  reducedMotion = false
): PointerState {
  let { theta, omega } = state;
  const k = config.k;
  // If reduced motion: critical damping (c = 2 * sqrt(k) = 60), reduced amplitude
  const c = reducedMotion ? 2 * Math.sqrt(k) : config.c;
  const maxDef = reducedMotion ? config.maxDeflection * 0.25 : config.maxDeflection;

  // Semi-implicit Euler integration
  const alpha = -k * theta - c * omega;
  omega += alpha * dt;

  // Cap angular velocity
  omega = Math.max(-config.maxOmega, Math.min(config.maxOmega, omega));
  theta += omega * dt;

  // Clamp deflection
  if (theta > maxDef) {
    theta = maxDef;
    if (omega > 0) omega = 0;
  } else if (theta < -maxDef * 0.3) {
    // Pointer cannot swing far counter-clockwise against the wheel
    theta = -maxDef * 0.3;
    if (omega < 0) omega = 0;
  }

  return {
    ...state,
    theta,
    omega,
  };
}

export interface PegHitEvent {
  hit: boolean;
  speedFraction: number; // 0..1 relative impact speed for sound
}

/**
 * Updates the pointer state over an elapsed frame delta.
 * Simulates multiple substeps of 1/240s for stability.
 */
export function updatePointerSimulation(
  state: PointerState,
  deltaMs: number,
  boundaryCrossings: number,
  wheelSpeedRadPerSec: number,
  config = POINTER_CONFIG,
  reducedMotion = false
): { nextState: PointerState; hits: PegHitEvent[] } {
  // Clamp frame delta to avoid spiral of death on tab-out
  const clampedDeltaMs = Math.min(config.maxFrameDeltaMs, Math.max(1, deltaMs));
  const dtTotal = clampedDeltaMs / 1000;

  // Update filtered boundaries per second
  const instantBps = dtTotal > 0 ? boundaryCrossings / dtTotal : 0;
  const alpha = 0.25; // smoothing factor
  const bpsFiltered = state.bpsFiltered * (1 - alpha) + instantBps * alpha;

  let currentState = { ...state, bpsFiltered };
  const hits: PegHitEvent[] = [];

  // Register crossing hits
  if (boundaryCrossings > 0) {
    const speedFraction = Math.min(1, Math.abs(wheelSpeedRadPerSec) / 15);
    for (let i = 0; i < boundaryCrossings; i++) {
      hits.push({ hit: true, speedFraction });
    }
  }

  // Fast regime (> 40 bps): hold steady deflection + tiny vibration
  if (bpsFiltered >= config.fastRegimeBps && !reducedMotion) {
    const steadyDeflection = config.maxDeflection * 0.65;
    // 1-2 degrees high frequency vibration
    const vibration = ((Math.random() - 0.5) * 2 * Math.PI) / 180;
    currentState.theta = steadyDeflection + vibration;
    currentState.omega = 0;
    currentState.isPegEngaged = true;
    return { nextState: currentState, hits };
  }

  // If a boundary crossed and not in fast regime, apply peg deflection impulse
  if (boundaryCrossings > 0) {
    const deflectionScale = reducedMotion ? 0.25 : 1.0;
    // Ramps the tip sideways in wheel travel direction
    const pushAngle = config.maxDeflection * 0.85 * deflectionScale;
    currentState.theta = Math.max(currentState.theta, pushAngle);
    // Give initial release velocity back towards center
    currentState.omega = -config.maxOmega * 0.6;
    currentState.isPegEngaged = false;
  }

  // Run fixed substeps
  const substep = config.substep;
  let remainingDt = dtTotal;

  while (remainingDt > 0) {
    const step = Math.min(substep, remainingDt);
    currentState = stepDampedSpring(currentState, step, config, reducedMotion);
    remainingDt -= step;
  }

  return { nextState: currentState, hits };
}

/**
 * Checks whether the pointer is settled at rest.
 */
export function isPointerAtRest(state: PointerState, config = POINTER_CONFIG): boolean {
  return (
    Math.abs(state.theta) <= config.restThetaEpsilon &&
    Math.abs(state.omega) <= config.restOmegaEpsilon
  );
}
