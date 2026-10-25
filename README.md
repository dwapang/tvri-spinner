# TVRI Spinner

A refined, production-quality web-based prize wheel designed for giveaways, doorprize draws, and internal broadcast events. Built with an Apple and Microsoft Fluent 2-inspired design language: calm, airy, minimal, and typography-first. TVRI Blue is the solitary brand anchor, directing visual focus to the wheel while surrounding controls remain quiet and unencumbered.

---

## Features

- **HTML Canvas 2D Wheel with DPR Awareness**: Crisp rendering on high-DPI (Retina) screens with an offscreen bitmap cache for smooth 60fps rotations.
- **Two Distinct Spinner Styles**:
  - **Grouped (Default)**: Slice arc is proportional to total stock ($\frac{\text{qty}}{\text{total units}} \times 360^\circ$).
  - **Individual**: Each physical unit is an individual slice ($360^\circ / \text{total units}$). Supports **Spread** arrangement (interleaved via phase positioning $(k + 0.5) / \text{qty}$) or **Together** (adjacent blocks). Capped at 200 slices with automatic graceful fallback.
- **Two Harmonious Wheel Palettes**:
  - **Blue (TVRI Theme)**: Lightness-alternating blue tones designed for high slice-boundary contrast.
  - **Colorful**: Apple system-inspired palette with vibrant, balanced tones.
  - Color is assigned dynamically per item (`colorIndex`) and updates synchronously across the wheel, prize list dots, and legend when switching palettes. Custom color overrides are fully supported.
  - High-contrast text labels: Yellow (`#FFCC00`) and Cyan (`#30B0C7`) automatically render dark navy typography (`#0F1B2D`) meeting WCAG AA requirements.
- **Deterministic Slice Shuffling**:
  - 56px circle Shuffle button immediately beside the SPIN button.
  - Reorders slices deterministically via a 53-bit seeded hash (`cyrb53`) and `crypto.getRandomValues`.
  - **Stock Stability**: After a win decrements stock, the wheel does NOT reshuffle; only the removed unit slice disappears. "Undo last win" restores it in the exact same position.
  - 600ms half-turn animation with midpoint cross-fade and toast with 5-second "Undo" action.
  - "Slice order" settings row with a "Reset to default" button.
- **Realistic Pointer Flapper Physics**:
  - Damped spring oscillator model ($k=900, c=21$) with peg contact simulation.
  - Three distinct speed regimes: high-frequency chattering vibration at high speeds, visible boundary strikes at medium speed, and snappy peg release at slow crawl.
  - Flapper rendered as a dedicated layer above canvas with dynamic rotating drop shadow ($x = \sin\theta \times 5\text{px}, y = \cos\theta \times 3 + 2\text{px}$).
  - Mandatory settling pause (200-300ms) ensuring pointer comes to complete rest ($\theta \approx 0, \dot{\theta} \approx 0$) before the Result Dialog opens.
- **Signature Result Moment**:
  - Winning slice remains vibrant while non-winning slices dim to 35% opacity.
  - Confetti burst in brand blue, white, and amber.
  - Dynamic font-fitting routine in Result Dialog: starts at 32px (up to 64px / 8vw in Presentation Mode) and steps down in 2px decrements with `padding-block: 0.12em` and `line-height: 1.24` so long prize names and descenders ('g', 'y', 'p', 'j', 'q') are never clipped.
  - Accessible focus management: focus lands on dialog container without premature focus rings on the close button.
- **Header Appearance**:
  - **Light Mode**: Solid TVRI Blue (`#0A4DA2`) header with white logo chip, white typography, and inverted fallback monogram.
  - **Dark Mode**: Solid dark header (`#05080F`, 45% darker than `--bg`) with a hairline border (`rgba(255,255,255,0.06)`).
  - Dynamic `<meta name="theme-color">` synchronization matching mobile browser status bars.
- **Synthesized WebAudio**: Procedural slice boundary ticks (volume-scaled by impact velocity and rate-capped to 30 ticks/s) and warm winning chord chimes synthesized entirely in WebAudio without external audio files.
- **Optional Prize Legend**:
  - Toggled via "Show prize legend under the wheel" in the Settings "Display" group (default OFF for an unencumbered focal stage).
  - Screen-reader accessible summary (`sr-only`) provided when visual legend is hidden.
- **Enlarged Tabs and Touch Targets**:
  - Prizes / History panel tabs: 44px height desktop / 48px mobile, 15px/16px semibold font, 10px thumb radius.
  - Header: 64px height desktop / 56px mobile, 19px title font.
  - Segmented controls with `white-space: nowrap` and responsive wrapping preventing text wraps on Indonesian labels ("Warna-warni").
- **Inventory Management**:
  - Inset grouped lists with color dots, percentage chance, and tabular steppers.
  - Add, edit, delete, and duplicate-name warnings.
  - Out-of-stock items dim to 50% with an "Out of stock" tag and are excluded from the wheel.
  - Load sample data, Export JSON, Import JSON, and Reset stock actions.
- **History & Undo**:
  - Spin log recording spin number, prize name, optional winner/ticket number, and timestamp.
  - "Undo last win" restores item quantity and removes the latest history entry.
  - CSV export for event records.
- **Presentation Mode**: Fullscreen mode (press `F` or toggle icon) hiding chrome for projector displays with enlarged wheel and hero-sized result dialog.
- **Bilingual i18n**: English and Bahasa Indonesia with unified pluralization summaries ("{p} prizes, {u} units" / "{p} hadiah, {u} unit").
- **Persistence & Migration**: Data safely stored under `tvri-spinner:v2` with automatic migration from v1 schemas.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6
- **Styling**: Tailwind CSS + Custom CSS Design Tokens (`tokens.css`)
- **Graphics**: HTML5 Canvas 2D API (Offscreen Canvas cached) + Dedicated SVG Flapper
- **Physics**: Pure damped spring simulation (`src/lib/pointerPhysics.ts`)
- **Audio**: Web Audio API (Synthesized oscillators and gain nodes)
- **Icons**: Lucide React (1.75 stroke)
- **Celebration**: `canvas-confetti` (Lazy loaded on demand)
- **Testing**: Vitest unit testing suite (18 unit tests)

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended, tested on Node v24)
- npm or pnpm

### Installation

```bash
git clone https://github.com/your-org/tvri-spinner.git
cd tvri-spinner
npm install
```

### Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
```

This compiles optimized assets to the `/dist` directory. To preview the production build locally:

```bash
npm run preview
```

### Running Unit Tests

```bash
npm run test
# Or with vitest run
npx vitest run
```

---

## Pointer Physics Model

The flapper needle is modeled as a damped harmonic oscillator with peg collision dynamics:

$$I \ddot{\theta} + c \dot{\theta} + k \theta = \tau_{\text{contact}}(t)$$

Constants defined in [`src/lib/pointerPhysics.ts`](file:///d:/Antigravity%20Project/TVRI%20SPIN/src/lib/pointerPhysics.ts):
- $k = 900\text{ rad/s}^2$ ($\omega_n = 30\text{ rad/s}$)
- $c = 21\text{ s}^{-1}$ ($\zeta = 0.35$)
- Maximum deflection clamped to $30^\circ$ ($0.5236\text{ rad}$)
- Fixed integration substeps of $1/240\text{ s}$ ($4.167\text{ ms}$)
- Rest criteria: $|\theta| \le 0.015\text{ rad}$ and $|\dot{\theta}| \le 0.1\text{ rad/s}$

---

## Storage Schema & Migration

Data is persisted under `tvri-spinner:v2`:

```ts
interface PersistentData {
  version: 2;
  items: Item[];
  settings: Settings;
  history: HistoryEntry[];
  nextColorIndex: number;
  rotation: number;
}
```

The v1 to v2 migration automatically strips stale palette hex values (`#0A4DA2`, `#007AFF`, etc.) from items so they follow the selected palette dynamically, while preserving genuine custom colors picked by the operator.

---

## Deployment to GitHub Pages

This repository includes automated deployment to GitHub Pages via GitHub Actions.

1. Ensure the repository name matches `tvri-spinner` (configured as `base: '/tvri-spinner/'` in `vite.config.ts`).
2. On GitHub, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Pushing to the `main` branch automatically builds and publishes the app to `https://<username>.github.io/tvri-spinner/`.
