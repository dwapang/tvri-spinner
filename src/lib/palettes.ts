import type { Item, PaletteType } from '../types';

export const BLUE_PALETTE = [
  '#0A4DA2',
  '#7FB2F2',
  '#1E78E0',
  '#B7D3F8',
  '#0D3B80',
  '#4F96EE',
  '#D6E6FB',
  '#2F6FD0',
  '#96C0F5',
  '#1A5BBD',
];

export const COLORFUL_PALETTE = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#5AC8FA',
  '#FFCC00',
  '#FF2D55',
  '#5856D6',
  '#30B0C7',
];

export function getPalette(paletteType: PaletteType): string[] {
  return paletteType === 'colorful' ? COLORFUL_PALETTE : BLUE_PALETTE;
}

/**
 * Derives the visual color for an item. Custom color has highest priority.
 * Otherwise uses item.colorIndex modulo palette length.
 */
export function getItemColor(item: Item, paletteType: PaletteType): string {
  if (item.color) {
    return item.color;
  }
  const palette = getPalette(paletteType);
  const index = Math.abs(item.colorIndex) % palette.length;
  return palette[index];
}
