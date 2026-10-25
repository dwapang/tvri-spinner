import type { Item, Settings, HistoryEntry, PersistentData } from '../types';
import { BLUE_PALETTE, COLORFUL_PALETTE } from './palettes';

export const STORAGE_KEY_V1 = 'tvri-spinner:v1';
export const STORAGE_KEY = 'tvri-spinner:v2';

export const DEFAULT_ITEMS: Item[] = [
  { id: 'item-1', name: 'Kaos TVRI', qty: 10, colorIndex: 0 },
  { id: 'item-2', name: 'Tote Bag TVRI', qty: 8, colorIndex: 1 },
  { id: 'item-3', name: 'Topi TVRI', qty: 6, colorIndex: 2 },
  { id: 'item-4', name: 'Mug TVRI', qty: 5, colorIndex: 3 },
  { id: 'item-5', name: 'Tumbler', qty: 4, colorIndex: 4 },
  { id: 'item-6', name: 'Payung', qty: 3, colorIndex: 5 },
  { id: 'item-7', name: 'Voucher Belanja', qty: 2, colorIndex: 6 },
  { id: 'item-8', name: 'TV 32"', qty: 1, colorIndex: 7 },
];

export const DEFAULT_SETTINGS: Settings = {
  style: 'grouped',
  palette: 'blue',
  arrangement: 'spread',
  durationMs: 6000,
  sound: true,
  autoReduce: true,
  appearance: 'system',
  language: 'en',
  showLegend: false,
  shuffleSeed: null,
};

export const INITIAL_DATA: PersistentData = {
  version: 2,
  items: DEFAULT_ITEMS,
  settings: DEFAULT_SETTINGS,
  history: [],
  nextColorIndex: DEFAULT_ITEMS.length,
  rotation: 0,
};

const BUILTIN_PALETTE_HEXES = new Set(
  [...BLUE_PALETTE, ...COLORFUL_PALETTE].map(c => c.toLowerCase())
);

/**
 * Migration helper: strips colors that match any built-in palette (case-insensitive)
 * so items properly follow the selected palette dynamically.
 */
export function migrateItemColors(items: Item[]): Item[] {
  return items.map(item => {
    if (!item.color) return item;
    const cleanColor = item.color.trim().toLowerCase();
    if (BUILTIN_PALETTE_HEXES.has(cleanColor)) {
      // Stale palette color from v1: strip it so it follows active palette
      const { color: _, ...rest } = item;
      return rest;
    }
    // Genuine custom color: keep it
    return item;
  });
}

/**
 * Migrates a raw persisted object from v1 or incomplete v2 to a valid v2 schema.
 */
export function migrateToV2(raw: any): PersistentData {
  if (!raw || typeof raw !== 'object') {
    return INITIAL_DATA;
  }

  const rawItems: Item[] = Array.isArray(raw.items)
    ? raw.items.map((it: Partial<Item>, i: number) => ({
        id: typeof it.id === 'string' ? it.id : `item-${Date.now()}-${i}`,
        name: typeof it.name === 'string' && it.name.trim().length > 0 ? it.name.slice(0, 40) : `Prize ${i + 1}`,
        qty: typeof it.qty === 'number' && Number.isInteger(it.qty) && it.qty >= 0 ? Math.min(it.qty, 999) : 1,
        color: typeof it.color === 'string' && it.color.startsWith('#') ? it.color : undefined,
        colorIndex: typeof it.colorIndex === 'number' ? it.colorIndex : i,
      }))
    : DEFAULT_ITEMS;

  const items = migrateItemColors(rawItems);

  const settings: Settings = {
    style: raw.settings?.style === 'individual' ? 'individual' : 'grouped',
    palette: raw.settings?.palette === 'colorful' ? 'colorful' : 'blue',
    arrangement: raw.settings?.arrangement === 'together' ? 'together' : 'spread',
    durationMs: [4000, 6000, 10000].includes(raw.settings?.durationMs) ? raw.settings.durationMs : 6000,
    sound: typeof raw.settings?.sound === 'boolean' ? raw.settings.sound : true,
    autoReduce: typeof raw.settings?.autoReduce === 'boolean' ? raw.settings.autoReduce : true,
    appearance: ['system', 'light', 'dark'].includes(raw.settings?.appearance) ? raw.settings.appearance : 'system',
    language: raw.settings?.language === 'id' ? 'id' : 'en',
    showLegend: typeof raw.settings?.showLegend === 'boolean' ? raw.settings.showLegend : false,
    shuffleSeed: typeof raw.settings?.shuffleSeed === 'number' ? raw.settings.shuffleSeed : null,
  };

  const history: HistoryEntry[] = Array.isArray(raw.history)
    ? raw.history.map((h: Partial<HistoryEntry>, idx: number) => ({
        id: typeof h.id === 'string' ? h.id : `hist-${idx}`,
        spinNo: typeof h.spinNo === 'number' ? h.spinNo : idx + 1,
        itemId: typeof h.itemId === 'string' ? h.itemId : '',
        itemName: typeof h.itemName === 'string' ? h.itemName : 'Prize',
        winnerName: typeof h.winnerName === 'string' ? h.winnerName : undefined,
        at: typeof h.at === 'string' ? h.at : new Date().toISOString(),
      }))
    : [];

  const nextColorIndex = typeof raw.nextColorIndex === 'number' ? raw.nextColorIndex : items.length;
  const rotation = typeof raw.rotation === 'number' && !isNaN(raw.rotation) ? raw.rotation : 0;

  return {
    version: 2,
    items,
    settings,
    history,
    nextColorIndex,
    rotation,
  };
}

export function loadStoredData(): PersistentData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_DATA;
  }

  try {
    // Try v2 first
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Fallback check v1
      raw = localStorage.getItem(STORAGE_KEY_V1);
    }
    if (!raw) {
      return INITIAL_DATA;
    }

    const parsed = JSON.parse(raw);
    const migrated = migrateToV2(parsed);
    // Persist migrated v2 data
    saveStoredData(migrated);
    return migrated;
  } catch {
    return INITIAL_DATA;
  }
}

export function saveStoredData(data: PersistentData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota or private browsing error handling
  }
}
