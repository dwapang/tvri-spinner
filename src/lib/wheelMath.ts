import type {
  Item,
  PaletteType,
  SpinnerStyle,
  IndividualArrangement,
  Slice,
} from '../types';
import { getItemColor } from './palettes';
import { getBestTextColor } from './color';
import { getRandomFraction, getRandomInt, getRandomRange } from './rng';

export const POINTER_ANGLE = -Math.PI / 2; // 12 o'clock in radians
export const MAX_INDIVIDUAL_SLICES = 200;

export interface WheelSlicesResult {
  slices: Slice[];
  totalUnits: number;
  capExceeded: boolean;
}

export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let normalized = angle % twoPi;
  if (normalized < 0) {
    normalized += twoPi;
  }
  return normalized;
}

/**
 * 53-bit deterministic seeded hash for shuffle ordering.
 */
export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Computes wheel slices based on inventory, spinner style, arrangement, and optional shuffle seed.
 */
export function computeSlices(
  items: Item[],
  style: SpinnerStyle,
  arrangement: IndividualArrangement,
  palette: PaletteType,
  shuffleSeed: number | null = null
): WheelSlicesResult {
  const activeItems = items.filter(it => it.qty > 0);
  const totalUnits = activeItems.reduce((acc, it) => acc + it.qty, 0);

  if (totalUnits === 0) {
    return { slices: [], totalUnits: 0, capExceeded: false };
  }

  // Check 200 slice cap for Individual style
  if (style === 'individual' && totalUnits > MAX_INDIVIDUAL_SLICES) {
    // Fall back to grouped
    const fallback = computeSlices(items, 'grouped', arrangement, palette, shuffleSeed);
    return {
      ...fallback,
      capExceeded: true,
    };
  }

  const slices: Slice[] = [];

  if (style === 'grouped') {
    let orderedItems = [...activeItems];
    if (shuffleSeed !== null) {
      orderedItems.sort((a, b) => {
        return cyrb53(a.id, shuffleSeed) - cyrb53(b.id, shuffleSeed);
      });
    }

    let currentAngle = 0;
    for (const item of orderedItems) {
      const fraction = item.qty / totalUnits;
      const arc = fraction * Math.PI * 2;
      const startAngle = currentAngle;
      const endAngle = currentAngle + arc;
      const color = getItemColor(item, palette);

      slices.push({
        id: item.id,
        itemId: item.id,
        name: item.name,
        color,
        startAngle,
        endAngle,
        angle: arc,
        textColor: getBestTextColor(color),
        labelVisible: arc >= 0.08, // At least ~4.5 degrees to draw label
      });

      currentAngle = endAngle;
    }
  } else {
    // Individual style: every unit is its own slice
    const sliceArc = (Math.PI * 2) / totalUnits;
    const tokens: Array<{ item: Item; unitIndex: number; phase: number }> = [];

    for (const item of activeItems) {
      for (let k = 0; k < item.qty; k++) {
        let phase = 0;
        if (shuffleSeed === null && arrangement === 'spread') {
          // Positioned at (k + 0.5) / qty
          phase = (k + 0.5) / item.qty;
        }
        tokens.push({ item, unitIndex: k, phase });
      }
    }

    if (shuffleSeed !== null) {
      // Shuffled order: deterministic hash of seed, itemId, and unitIndex
      tokens.sort((a, b) => {
        const hashA = cyrb53(`${a.item.id}:${a.unitIndex}`, shuffleSeed);
        const hashB = cyrb53(`${b.item.id}:${b.unitIndex}`, shuffleSeed);
        return hashA - hashB;
      });
    } else if (arrangement === 'spread') {
      tokens.sort((a, b) => {
        if (Math.abs(a.phase - b.phase) > 1e-7) {
          return a.phase - b.phase;
        }
        return a.item.colorIndex - b.item.colorIndex;
      });
    }

    let currentAngle = 0;
    tokens.forEach(token => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceArc;
      const color = getItemColor(token.item, palette);

      slices.push({
        id: `${token.item.id}-${token.unitIndex}`,
        itemId: token.item.id,
        name: token.item.name,
        color,
        startAngle,
        endAngle,
        angle: sliceArc,
        textColor: getBestTextColor(color),
        labelVisible: sliceArc >= 0.08,
        unitIndex: token.unitIndex,
      });

      currentAngle = endAngle;
    });
  }

  return { slices, totalUnits, capExceeded: false };
}

/**
 * Finds the slice that lies directly beneath the pointer (12 o'clock)
 * at the given rotation angle.
 */
export function getSliceAtRotation(slices: Slice[], rotation: number): Slice | null {
  if (slices.length === 0) return null;

  // The slice angle directly under the pointer
  const angleUnderPointer = normalizeAngle(POINTER_ANGLE - rotation);

  for (const slice of slices) {
    if (angleUnderPointer >= slice.startAngle && angleUnderPointer < slice.endAngle) {
      return slice;
    }
  }

  // Edge case floating point wrap at 2*PI -> belongs to last slice
  return slices[slices.length - 1];
}

/**
 * Selects a winning item using crypto bias-free rejection sampling,
 * and finds a corresponding target slice directly from current slices.
 */
export function pickWinner(slices: Slice[], items: Item[]): {
  winnerItem: Item;
  targetSlice: Slice;
} {
  const activeItems = items.filter(it => it.qty > 0);
  const totalUnits = activeItems.reduce((acc, it) => acc + it.qty, 0);

  if (totalUnits === 0 || slices.length === 0) {
    throw new Error('Cannot pick winner with no available units');
  }

  // Pick random unit index in [0, totalUnits - 1]
  const randomUnit = getRandomInt(totalUnits);

  let accum = 0;
  let winnerItem: Item = activeItems[0];
  for (const item of activeItems) {
    accum += item.qty;
    if (randomUnit < accum) {
      winnerItem = item;
      break;
    }
  }

  // Find all slices matching this winnerItem in the current layout
  const matchingSlices = slices.filter(s => s.itemId === winnerItem.id);
  if (matchingSlices.length === 0) {
    throw new Error(`No slice found for winning item ${winnerItem.name}`);
  }

  // If multiple slices (Individual mode), pick one uniformly among them
  const sliceIndex = getRandomInt(matchingSlices.length);
  const targetSlice = matchingSlices[sliceIndex];

  return { winnerItem, targetSlice };
}

/**
 * Computes the destination rotation angle for landing inside the targetSlice
 * with 5 to 8 full turns and at least 10% away from slice boundaries.
 */
export function computeFinalRotation(
  currentRotation: number,
  targetSlice: Slice,
  turns?: number
): { finalRotation: number; landingAngle: number } {
  const arc = targetSlice.endAngle - targetSlice.startAngle;
  // Point inside slice, at least 10% away from edges: [0.10, 0.90]
  const offsetFraction = 0.10 + getRandomFraction() * 0.80;
  const landingAngle = targetSlice.startAngle + offsetFraction * arc;

  // Desired rotation modulo 2*PI: POINTER_ANGLE - landingAngle
  const targetMod = normalizeAngle(POINTER_ANGLE - landingAngle);
  const currentMod = normalizeAngle(currentRotation);

  let delta = targetMod - currentMod;
  if (delta < 0) {
    delta += Math.PI * 2;
  }

  const fullTurns = turns !== undefined ? turns : getRandomRange(5, 8);
  const finalRotation = currentRotation + delta + fullTurns * Math.PI * 2;

  return { finalRotation, landingAngle };
}

/**
 * Counts the exact number of slice boundaries that cross the pointer (at 12 o'clock, -PI/2)
 * between prevRotation and currRotation.
 */
export function countBoundaryCrossings(
  slices: Slice[],
  prevRot: number,
  currRot: number
): number {
  if (slices.length === 0 || currRot <= prevRot) return 0;
  const TWO_PI = Math.PI * 2;
  const offset = Math.PI / 2; // -(-PI/2) = +PI/2
  let total = 0;
  for (let i = 0; i < slices.length; i++) {
    const angle = slices[i].startAngle;
    const countPrev = Math.floor((prevRot + offset + angle) / TWO_PI);
    const countCurr = Math.floor((currRot + offset + angle) / TWO_PI);
    total += Math.max(0, countCurr - countPrev);
  }
  return total;
}

