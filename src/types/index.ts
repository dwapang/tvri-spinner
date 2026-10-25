export interface Item {
  id: string;
  name: string;
  qty: number;
  color?: string;
  colorIndex: number;
}

export type SpinnerStyle = 'grouped' | 'individual';
export type PaletteType = 'blue' | 'colorful';
export type IndividualArrangement = 'spread' | 'together';
export type AppearanceMode = 'system' | 'light' | 'dark';
export type Language = 'en' | 'id';

export interface Settings {
  style: SpinnerStyle;
  palette: PaletteType;
  arrangement: IndividualArrangement;
  durationMs: number; // 4000 | 6000 | 10000
  sound: boolean;
  autoReduce: boolean;
  appearance: AppearanceMode;
  language: Language;
  showLegend: boolean;
  shuffleSeed: number | null;
}

export interface HistoryEntry {
  id: string;
  spinNo: number;
  itemId: string;
  itemName: string;
  winnerName?: string;
  at: string;
}

export interface Slice {
  id: string;
  itemId: string;
  name: string;
  color: string;
  startAngle: number; // in radians [0, 2*PI]
  endAngle: number;   // in radians
  angle: number;      // endAngle - startAngle
  textColor: string;  // high WCAG contrast color (#FFFFFF or #0F1B2D)
  labelVisible: boolean;
  unitIndex?: number;
}

export interface PersistentData {
  version: 2;
  items: Item[];
  settings: Settings;
  history: HistoryEntry[];
  nextColorIndex: number;
  rotation: number;
}
