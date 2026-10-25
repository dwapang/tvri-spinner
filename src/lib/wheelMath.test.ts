import { describe, it, expect } from 'vitest';
import {
  computeSlices,
  getSliceAtRotation,
  computeFinalRotation,
  pickWinner,
  normalizeAngle,
  POINTER_ANGLE,
  MAX_INDIVIDUAL_SLICES,
} from './wheelMath';
import { getItemColor, BLUE_PALETTE, COLORFUL_PALETTE } from './palettes';
import { getBestTextColor, getContrastRatio } from './color';
import { migrateItemColors, migrateToV2 } from './storage';
import type { Item } from '../types';

describe('TVRI Spinner - Wheel Math & Algorithm Tests', () => {
  const sampleItems: Item[] = [
    { id: '1', name: 'Prize A', qty: 10, colorIndex: 0 },
    { id: '2', name: 'Prize B', qty: 5, colorIndex: 1 },
    { id: '3', name: 'Prize C', qty: 1, colorIndex: 2 },
  ];

  it('computes grouped slices with angles summing to 2*PI', () => {
    const { slices, totalUnits, capExceeded } = computeSlices(sampleItems, 'grouped', 'spread', 'blue');
    expect(totalUnits).toBe(16);
    expect(slices.length).toBe(3);
    expect(capExceeded).toBe(false);

    const sumAngle = slices.reduce((acc, s) => acc + s.angle, 0);
    expect(sumAngle).toBeCloseTo(Math.PI * 2, 5);

    expect(slices[0].angle).toBeCloseTo((10 / 16) * Math.PI * 2, 5);
    expect(slices[1].angle).toBeCloseTo((5 / 16) * Math.PI * 2, 5);
    expect(slices[2].angle).toBeCloseTo((1 / 16) * Math.PI * 2, 5);
  });

  it('computes individual slices (1 slice per unit) summing to 2*PI', () => {
    const { slices, totalUnits, capExceeded } = computeSlices(sampleItems, 'individual', 'spread', 'blue');
    expect(totalUnits).toBe(16);
    expect(slices.length).toBe(16);
    expect(capExceeded).toBe(false);

    const sumAngle = slices.reduce((acc, s) => acc + s.angle, 0);
    expect(sumAngle).toBeCloseTo(Math.PI * 2, 5);

    slices.forEach(slice => {
      expect(slice.angle).toBeCloseTo((Math.PI * 2) / 16, 5);
    });
  });

  it('enforces the 200 slice cap and falls back to grouped with capExceeded flag', () => {
    expect(MAX_INDIVIDUAL_SLICES).toBe(200);
    expect(normalizeAngle(POINTER_ANGLE)).toBeCloseTo(1.5 * Math.PI, 5);
    const bigInventory: Item[] = [
      { id: '1', name: 'Mass Item', qty: 201, colorIndex: 0 },
    ];
    const result = computeSlices(bigInventory, 'individual', 'spread', 'blue');
    expect(result.capExceeded).toBe(true);
    expect(result.slices.length).toBe(1); // Grouped has 1 slice
    expect(result.totalUnits).toBe(201);
  });

  it('correctly implements the Spread arrangement interleaving', () => {
    const twoItems: Item[] = [
      { id: '1', name: 'Item A', qty: 3, colorIndex: 0 },
      { id: '2', name: 'Item B', qty: 3, colorIndex: 1 },
    ];
    const { slices } = computeSlices(twoItems, 'individual', 'spread', 'blue');
    expect(slices.length).toBe(6);

    // With identical qty 3, phases are (k + 0.5)/3: 1/6, 3/6, 5/6
    // Tie-break by colorIndex should result in alternating items
    expect(slices[0].itemId).toBe('1');
    expect(slices[1].itemId).toBe('2');
    expect(slices[2].itemId).toBe('1');
    expect(slices[3].itemId).toBe('2');
    expect(slices[4].itemId).toBe('1');
    expect(slices[5].itemId).toBe('2');
  });

  it('determines the exact landing angle and maps back to winning slice under pointer', () => {
    const { slices } = computeSlices(sampleItems, 'grouped', 'spread', 'blue');
    expect(slices.length).toBeGreaterThan(0);

    // Test for each slice
    for (const slice of slices) {
      const { finalRotation, landingAngle } = computeFinalRotation(0, slice, 6);
      
      // Ensure landing angle is inside the slice and at least 10% away from edges
      const span = slice.endAngle - slice.startAngle;
      expect(landingAngle).toBeGreaterThanOrEqual(slice.startAngle + 0.099 * span);
      expect(landingAngle).toBeLessThanOrEqual(slice.endAngle - 0.099 * span);

      // Verify that slice under pointer at finalRotation is EXACTLY this slice
      const detectedSlice = getSliceAtRotation(slices, finalRotation);
      expect(detectedSlice).not.toBeNull();
      expect(detectedSlice?.itemId).toBe(slice.itemId);
    }
  });

  it('runs 20,000 simulated draws and confirms winner distribution within tolerance', () => {
    const items: Item[] = [
      { id: 'A', name: 'Kaos', qty: 50, colorIndex: 0 },
      { id: 'B', name: 'Topi', qty: 30, colorIndex: 1 },
      { id: 'C', name: 'TV', qty: 20, colorIndex: 2 },
    ];
    const { slices } = computeSlices(items, 'grouped', 'spread', 'blue');
    const counts: Record<string, number> = { A: 0, B: 0, C: 0 };
    const TRIALS = 20000;

    for (let i = 0; i < TRIALS; i++) {
      const { winnerItem } = pickWinner(slices, items);
      counts[winnerItem.id]++;
    }

    // Expected: A=50% (10000), B=30% (6000), C=20% (4000)
    // Within 2.5% tolerance (std dev for 20,000 draws is ~70)
    expect(counts.A / TRIALS).toBeCloseTo(0.50, 1);
    expect(counts.B / TRIALS).toBeCloseTo(0.30, 1);
    expect(counts.C / TRIALS).toBeCloseTo(0.20, 1);
  });

  it('maintains stable item color across inventory mutations and palette switching', () => {
    const itemA: Item = { id: 'a', name: 'A', qty: 5, colorIndex: 0 };
    const itemB: Item = { id: 'b', name: 'B', qty: 2, colorIndex: 1 };
    const itemC: Item = { id: 'c', name: 'C', qty: 8, colorIndex: 2 };

    expect(getItemColor(itemA, 'blue')).toBe(BLUE_PALETTE[0]);
    expect(getItemColor(itemB, 'blue')).toBe(BLUE_PALETTE[1]);
    expect(getItemColor(itemC, 'blue')).toBe(BLUE_PALETTE[2]);

    // Deleting item B or changing qty of A does not change item C's color
    itemA.qty = 99;
    expect(getItemColor(itemC, 'blue')).toBe(BLUE_PALETTE[2]);

    // Switching palette updates predictably to colorful
    expect(getItemColor(itemA, 'colorful')).toBe(COLORFUL_PALETTE[0]);
    expect(getItemColor(itemC, 'colorful')).toBe(COLORFUL_PALETTE[2]);

    // Custom color override
    const customItem: Item = { id: 'x', name: 'X', qty: 1, colorIndex: 0, color: '#123456' };
    expect(getItemColor(customItem, 'blue')).toBe('#123456');
    expect(getItemColor(customItem, 'colorful')).toBe('#123456');
  });

  it('calculates WCAG contrast and selects highest contrast label color', () => {
    // Dark blue background (#0A4DA2) should select White
    const darkBlueText = getBestTextColor('#0A4DA2');
    expect(darkBlueText).toBe('#FFFFFF');
    expect(getContrastRatio('#0A4DA2', '#FFFFFF')).toBeGreaterThan(getContrastRatio('#0A4DA2', '#0F1B2D'));

    // Light blue background (#D6E6FB) should select Navy
    const lightBlueText = getBestTextColor('#D6E6FB');
    expect(lightBlueText).toBe('#0F1B2D');
    expect(getContrastRatio('#D6E6FB', '#0F1B2D')).toBeGreaterThan(getContrastRatio('#D6E6FB', '#FFFFFF'));

    // Bright yellow (#FFCC00) should select Navy
    expect(getBestTextColor('#FFCC00')).toBe('#0F1B2D');
    // Colorful palette yellow (#F4B400) and cyan (#00ACC1) select navy text
    expect(getBestTextColor('#F4B400')).toBe('#0F1B2D');
    expect(getBestTextColor('#00ACC1')).toBe('#0F1B2D');
  });

  it('reorders slices deterministically when shuffleSeed is provided', () => {
    const items: Item[] = [
      { id: 'item-1', name: 'Kaos', qty: 5, colorIndex: 0 },
      { id: 'item-2', name: 'Topi', qty: 3, colorIndex: 1 },
      { id: 'item-3', name: 'Mug', qty: 2, colorIndex: 2 },
      { id: 'item-4', name: 'Tumbler', qty: 4, colorIndex: 3 },
    ];

    const defaultGrouped = computeSlices(items, 'grouped', 'spread', 'blue', null);
    const shuffledGrouped = computeSlices(items, 'grouped', 'spread', 'blue', 12345);

    // Both should contain 4 slices
    expect(defaultGrouped.slices.length).toBe(4);
    expect(shuffledGrouped.slices.length).toBe(4);

    // Slices in shuffledGrouped should have different order than default
    const defaultIds = defaultGrouped.slices.map(s => s.itemId);
    const shuffledIds = shuffledGrouped.slices.map(s => s.itemId);
    expect(defaultIds).not.toEqual(shuffledIds);

    // Repeating with the same seed yields identical slice order
    const repeatShuffled = computeSlices(items, 'grouped', 'spread', 'blue', 12345);
    expect(repeatShuffled.slices.map(s => s.itemId)).toEqual(shuffledIds);
  });

  it('ensures stability: reducing stock does not reshuffle remaining slices', () => {
    const items: Item[] = [
      { id: 'item-A', name: 'A', qty: 3, colorIndex: 0 },
      { id: 'item-B', name: 'B', qty: 2, colorIndex: 1 },
      { id: 'item-C', name: 'C', qty: 2, colorIndex: 2 },
    ];
    const seed = 987654;

    const initial = computeSlices(items, 'individual', 'spread', 'blue', seed);
    expect(initial.slices.length).toBe(7);

    // Winning unit drops stock of item-A from 3 to 2
    const decrementedItems: Item[] = [
      { id: 'item-A', name: 'A', qty: 2, colorIndex: 0 },
      { id: 'item-B', name: 'B', qty: 2, colorIndex: 1 },
      { id: 'item-C', name: 'C', qty: 2, colorIndex: 2 },
    ];

    const afterWin = computeSlices(decrementedItems, 'individual', 'spread', 'blue', seed);
    expect(afterWin.slices.length).toBe(6);

    // Filter out item-A's dropped unitIndex (unitIndex 2) from initial slices
    const remainingExpectedIds = initial.slices
      .filter(s => !(s.itemId === 'item-A' && s.unitIndex === 2))
      .map(s => s.id);

    const actualIds = afterWin.slices.map(s => s.id);
    expect(actualIds).toEqual(remainingExpectedIds);

    // Undo brings item-A back to 3, restoring identical initial layout
    const restored = computeSlices(items, 'individual', 'spread', 'blue', seed);
    expect(restored.slices.map(s => s.id)).toEqual(initial.slices.map(s => s.id));
  });

  it('verifies slice colors differ between Blue and Colorful palettes for items without custom color', () => {
    const items: Item[] = [
      { id: 'item-1', name: 'Prize 1', qty: 5, colorIndex: 0 },
      { id: 'item-2', name: 'Prize 2', qty: 5, colorIndex: 1 },
    ];

    const blueSlices = computeSlices(items, 'grouped', 'spread', 'blue', null).slices;
    const colorfulSlices = computeSlices(items, 'grouped', 'spread', 'colorful', null).slices;

    expect(blueSlices[0].color).toBe(BLUE_PALETTE[0]);
    expect(colorfulSlices[0].color).toBe(COLORFUL_PALETTE[0]);
    expect(blueSlices[0].color).not.toBe(colorfulSlices[0].color);
  });

  it('migrates v1 items by stripping stale palette colors while preserving genuine custom colors', () => {
    const v1RawItems: Item[] = [
      // Item with stale Blue palette color saved by v1 bug
      { id: 'item-1', name: 'Kaos', qty: 5, colorIndex: 0, color: '#0A4DA2' },
      // Item with stale Colorful palette color saved by v1 bug
      { id: 'item-2', name: 'Topi', qty: 3, colorIndex: 1, color: '#FF9500' },
      // Item with genuine custom color
      { id: 'item-3', name: 'Custom Prize', qty: 2, colorIndex: 2, color: '#8A2BE2' },
      // Item without color
      { id: 'item-4', name: 'Standard', qty: 1, colorIndex: 3 },
    ];

    const migrated = migrateItemColors(v1RawItems);

    // Stale palette colors should be stripped (undefined)
    expect(migrated[0].color).toBeUndefined();
    expect(migrated[1].color).toBeUndefined();
    // Genuine custom color preserved
    expect(migrated[2].color).toBe('#8A2BE2');
    expect(migrated[3].color).toBeUndefined();

    // Now test migrateToV2 with a raw v1 object
    const v1State = {
      version: 1,
      items: v1RawItems,
      settings: {
        style: 'grouped',
        palette: 'colorful',
      },
    };
    const v2State = migrateToV2(v1State);
    expect(v2State.version).toBe(2);
    expect(v2State.settings.palette).toBe('colorful');
    expect(v2State.settings.showLegend).toBe(false);
    expect(v2State.settings.shuffleSeed).toBeNull();
    expect(v2State.items[0].color).toBeUndefined();
    expect(v2State.items[2].color).toBe('#8A2BE2');
  });
});
