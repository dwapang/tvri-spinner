/**
 * WCAG 2.1 Color contrast calculations and color utilities.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function parseHex(hex: string): RGB {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 10, g: 77, b: 162 }; // fallback brand blue
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getRelativeLuminance(rgb: RGB): number {
  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(parseHex(color1));
  const lum2 = getRelativeLuminance(parseHex(color2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns either white (#FFFFFF) or deep navy (#0F1B2D) based on which has
 * higher WCAG contrast against the given background.
 */
export function getBestTextColor(bgColor: string): string {
  const whiteRatio = getContrastRatio(bgColor, '#FFFFFF');
  const navyRatio = getContrastRatio(bgColor, '#0F1B2D');
  return whiteRatio >= navyRatio ? '#FFFFFF' : '#0F1B2D';
}
