import { describe, it, expect } from 'vitest';
import {
  createInitialPointerState,
  stepDampedSpring,
  updatePointerSimulation,
  isPointerAtRest,
  POINTER_CONFIG,
} from './pointerPhysics';
import { countBoundaryCrossings } from './wheelMath';
import type { Slice } from '../types';

describe('Pointer Physics Simulation', () => {
  it('initializes at rest', () => {
    const state = createInitialPointerState();
    expect(state.theta).toBe(0);
    expect(state.omega).toBe(0);
    expect(isPointerAtRest(state)).toBe(true);
  });

  it('steps damped spring oscillator correctly without exploding', () => {
    let state = createInitialPointerState();
    // Displace by 15 degrees
    state.theta = (15 * Math.PI) / 180;

    // Step forward 1 second in 4ms substeps
    for (let i = 0; i < 250; i++) {
      state = stepDampedSpring(state, POINTER_CONFIG.substep);
    }

    // Must settle back to near-zero
    expect(isPointerAtRest(state)).toBe(true);
    expect(Math.abs(state.theta)).toBeLessThan(0.01);
  });

  it('deflects on boundary hit and returns to rest in under 400ms', () => {
    let state = createInitialPointerState();

    // 1 boundary hit at mid-spin speed (10 rad/s)
    const { nextState } = updatePointerSimulation(state, 16, 1, 10);
    state = nextState;

    expect(state.theta).toBeGreaterThan(0.2); // Deflection kicked

    // Simulate 380ms of free settling (no more hits)
    const frames = Math.floor(380 / 16);
    for (let f = 0; f < frames; f++) {
      const res = updatePointerSimulation(state, 16, 0, 0);
      state = res.nextState;
    }

    // Settled at rest before 400ms
    expect(isPointerAtRest(state)).toBe(true);
  });

  it('clamps maximum deflection to 30 degrees (POINTER_CONFIG.maxDeflection)', () => {
    let state = createInitialPointerState();
    state.theta = Math.PI; // huge initial deflection
    state.omega = 100; // huge velocity

    const stepped = stepDampedSpring(state, POINTER_CONFIG.substep);
    expect(stepped.theta).toBeLessThanOrEqual(POINTER_CONFIG.maxDeflection);
    expect(stepped.theta).toBeGreaterThanOrEqual(-POINTER_CONFIG.maxDeflection * 0.3);
  });

  it('remains stable and produces no NaN or Infinity under extreme delta or crossing bursts', () => {
    let state = createInitialPointerState();

    // 100 boundary crossings in 100ms
    for (let i = 0; i < 20; i++) {
      const res = updatePointerSimulation(state, 50, 20, 50);
      state = res.nextState;
      expect(Number.isFinite(state.theta)).toBe(true);
      expect(Number.isFinite(state.omega)).toBe(true);
    }
  });

  it('accurately counts boundary crossings between rotations', () => {
    const dummySlices: Slice[] = [
      {
        id: '1',
        itemId: '1',
        name: 'Slice 1',
        color: '#0A4DA2',
        textColor: '#FFFFFF',
        startAngle: 0,
        endAngle: Math.PI,
        angle: Math.PI,
        labelVisible: true,
      },
      {
        id: '2',
        itemId: '2',
        name: 'Slice 2',
        color: '#1E78E0',
        textColor: '#FFFFFF',
        startAngle: Math.PI,
        endAngle: Math.PI * 2,
        angle: Math.PI,
        labelVisible: true,
      },
    ];

    // Zero delta -> 0 crossings
    expect(countBoundaryCrossings(dummySlices, 0, 0)).toBe(0);

    // One full turn (2*PI) across 2 slices -> exactly 2 crossings
    expect(countBoundaryCrossings(dummySlices, 0, Math.PI * 2)).toBe(2);

    // Five full turns -> exactly 10 crossings
    expect(countBoundaryCrossings(dummySlices, 0, Math.PI * 2 * 5)).toBe(10);
  });
});
