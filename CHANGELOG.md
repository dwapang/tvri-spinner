# Changelog

All notable changes to the TVRI Spinner project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-25

### Added
- **Shuffle Button**: Added a 56px circle secondary button with Lucide `Shuffle` immediately beside the primary SPIN button. Deterministically shuffles slice ordering using a 53-bit seeded hash (`cyrb53`) and `crypto.getRandomValues`.
  - Grouped style reorders items; Individual style reorders individual unit slices.
  - Stable slice layout: reducing stock on win only drops the highest unit index of that item without reshuffling remaining units. "Undo last win" restores it in the exact same position.
  - 600ms half-turn animation (`cubic-bezier(0.2, 0.8, 0.2, 1)`) with midpoint cross-fade and spinning shuffle icon.
  - Interactive toast "Wheel shuffled" (ID: "Roda diacak") with a 5-second "Undo" action.
  - "Slice order" row in Settings with a "Reset to default" button.
- **Realistic Pointer Flapper Physics**: Modeled as a damped harmonic oscillator ($k=900, c=21$) with peg contact simulation in `src/lib/pointerPhysics.ts`.
  - Three speed regimes: high-frequency chattering vibration at fast spin, distinct boundary strikes at medium speed, and snappy peg release at slow crawl.
  - Volume-scaled audio ticks rate-capped to 30 ticks/s.
  - Flapper rendered as a dedicated overlay layer above canvas with rotating dynamic drop shadow ($x = \sin\theta \times 5\text{px}, y = \cos\theta \times 3 + 2\text{px}$).
  - Mandatory settling pause (200-300ms) ensuring pointer flapper reaches complete rest before the Result Dialog opens.
- **Display Setting for Prize Legend**: Added "Show prize legend under the wheel" toggle in a new "Display" group in Settings (default OFF).
  - Off by default to provide an unencumbered focal stage on the wheel.
  - Screen-reader accessible fallback (`sr-only`) persists slice odds and units when visual legend is hidden.
- **Dynamic `<meta name="theme-color">` Sync**: Syncs browser status bar color with the solid header tone (#0A4DA2 in light mode, #05080F in dark mode).
- **Live Color Swatch Preview in Prize Form**: In Add/Edit prize form, color defaults to "Auto (follows wheel colors)" with a live swatch preview of the assigned palette color, accompanied by a "Use wheel color" reset button.

### Fixed
- **Colorful Wheel Palette Inactivity (Bug 2)**:
  - *Root Cause*: Previous sample items and save handlers persisted resolved hex strings into `item.color`, which took precedence over the active palette.
  - *Fix*: Replaced schema with v2 (`tvri-spinner:v2`). Implemented `migrateItemColors` which strips stale palette hex values while preserving genuine custom colors. Slices, dots, and legends now react dynamically to palette changes.
  - High-contrast text: yellow (`#FFCC00`) and cyan (`#30B0C7`) slices now correctly render dark navy labels (`#0F1B2D`) instead of illegible white.
- **Prize Name Clipping in Result Dialog & Presentation Mode (Bug 7)**:
  - *Root Cause*: Aggressive `line-clamp-3` combined with zero vertical padding caused font descenders ('g', 'y', 'p', 'j', 'q') to clip, and truncated long prize names.
  - *Fix*: Removed `line-clamp` and `overflow: hidden`. Implemented `padding-block: 0.12em`, `line-height: 1.24`, `text-wrap: balance`, and a responsive `useLayoutEffect` font-stepping routine down to 20px so long names always fit comfortably. Presentation mode supports hero sizes up to 64px (or 8vw).
- **Mixed-Language Summary Text (Item 9)**:
  - *Root Cause*: Hardcoded string concatenation (`${activeItems.length} prizes, ${totalUnits} units`) bypassed i18n translation.
  - *Fix*: Replaced with localized `prizesSummary` ("{p} hadiah, {u} unit" in Indonesian) and `spinsSummary` with proper singular/plural grammar.
- **Segmented Control Text Wrapping (Item 10)**:
  - *Root Cause*: Tight flex constraints without `white-space: nowrap` caused "Warna-warni" to wrap onto two lines.
  - *Fix*: Added `whitespace-nowrap` to all segment buttons, and wrapped the Style and Wheel Colors controls into neat responsive rows.
- **Focus Ring on Modal Close Button (Item 11)**:
  - *Root Cause*: Modal auto-focus grabbed the first focusable element (the close button), drawing a thick blue focus ring on dialog open.
  - *Fix*: Set `tabIndex={-1}` and `outline-none` on the modal shell container and directed initial focus to the container. Close button only renders focus rings under keyboard `:focus-visible` tab navigation.

### Changed
- **Enlarged Segmented Control & Header**:
  - Prizes / History panel tabs upgraded to Size LG: 44px height on desktop, 48px on mobile, 15px/16px semibold font, and 10px thumb radius.
  - Header height increased to 64px on desktop (56px mobile), 19px title font, 32px logo mark on white chip, and 40px touch targets.
- **Solid Light Header**: Changed header in light appearance from translucent surface to solid TVRI Brand Blue (`--header-bg: #0A4DA2`) with crisp white typography, inverted monogram, and white icons.
- **Solid Dark Header**: Changed header in dark appearance to solid darker background (`--header-bg: #05080F`, 45% darker than `--bg: #0B1220`) with 1px border `rgba(255,255,255,0.06)` and zero blur.
- **Storage Schema Upgrade**: Version bumped to `2` (`tvri-spinner:v2`) with backward-compatible migration from `tvri-spinner:v1`.
