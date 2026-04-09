# Design System: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09

---

## Design Tokens (TypeScript)

```typescript
// lib/design/tokens.ts

export const tokens = {
  color: {
    // LCD Display
    lcdBg: '#b8c9a3',
    lcdSprite: '#1a1a1a',
    lcdGhost: 'rgba(26, 26, 26, 0.12)',
    lcdSegmentOff: 'rgba(26, 26, 26, 0.05)',

    // Device Frame
    frameBody: '#e8e0d0',
    frameBezel: '#c47a7a',
    frameLabel: '#2a2a2a',
    frameButtonA: '#3a3a5c',
    frameButtonB: '#5c3a3a',
    frameButtonText: '#ffffff',
    frameButtonInactive: '#9a9a9a',

    // App Shell
    pageBg: '#1a1a1a',
    pageText: '#b8c9a3',
    pageMuted: 'rgba(184, 201, 163, 0.5)',

    // Overlays
    missText: '#1a1a1a',
    gameOverOverlay: 'rgba(0, 0, 0, 0.15)',
  },

  spacing: {
    framePaddingMin: 12,   // px
    framePaddingMax: 32,   // px
    screenBorderRadius: 8, // px
    frameRadius: 16,       // px
    buttonSize: 36,        // px base
    buttonSizeMin: 28,     // px (mobile)
    buttonSizeMax: 44,     // px (desktop)
  },

  canvas: {
    logicalWidth: 400,
    logicalHeight: 300,
    aspectRatio: '4 / 3',
  },

  timing: {
    ghostDurationMs: 100,
    missFlashMs: 1500,
    sharkVisibleMs: 800,
    catchFrameMs: 100,
    gameOverFadeMs: 300,
    waterAnimHz: 1,       // waves cycle at 1Hz
    startFlashHz: 1,      // PUSH START blink
  },

  game: {
    boatPositions: 5,
    maxMisses: 3,
    maxScore: 999,

    modeA: {
      tickMs: 500,
      heliCoolMs: 2000,
      maxParachutists: 2,
      fallRates: [0.25, 0.33, 0.50], // per-zone subzone progress per tick
    },

    modeB: {
      tickMs: 385,
      heliCoolMs: 1200,
      maxParachutists: 3,
      fallRates: [0.33, 0.43, 0.65],
    },
  },
} as const;

export type Tokens = typeof tokens;
```

---

## CSS Custom Properties

```css
/* app/globals.css */

:root {
  /* LCD */
  --c-lcd-bg: #b8c9a3;
  --c-lcd-sprite: #1a1a1a;
  --c-lcd-ghost: rgba(26, 26, 26, 0.12);

  /* Frame */
  --c-frame-body: #e8e0d0;
  --c-frame-bezel: #c47a7a;
  --c-frame-label: #2a2a2a;
  --c-frame-btn-a: #3a3a5c;
  --c-frame-btn-b: #5c3a3a;

  /* Shell */
  --c-page-bg: #1a1a1a;
  --c-page-text: #b8c9a3;

  /* Spacing */
  --frame-pad: clamp(12px, 3vw, 32px);
  --frame-radius: 16px;
  --screen-radius: 8px;
  --btn-size: clamp(28px, 5vw, 44px);

  /* Transition */
  --t-ghost: 100ms linear;
  --t-fade: 300ms ease;
}
```

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lcd: {
          bg: '#b8c9a3',
          sprite: '#1a1a1a',
        },
        frame: {
          body: '#e8e0d0',
          bezel: '#c47a7a',
          label: '#2a2a2a',
          btnA: '#3a3a5c',
          btnB: '#5c3a3a',
        },
        page: {
          bg: '#1a1a1a',
          text: '#b8c9a3',
        },
      },
      borderRadius: {
        frame: '16px',
        screen: '8px',
      },
      fontFamily: {
        label: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Component Specifications

### `DeviceFrame`

**Purpose**: The cream plastic shell that contains the LCD screen and controls.

```
Visual anatomy:
┌─────────────────────────────────────────┐
│          PARACHUTE                       │  ← label-top
│  ┌──────────────────────────────────┐   │
│  │  [rose bezel padding]            │   │  ← screen-bezel (--c-frame-bezel)
│  │  ┌────────────────────────────┐  │   │
│  │  │                            │  │   │  ← screen-inner (--c-lcd-bg)
│  │  │   [canvas renders here]    │  │   │
│  │  │                            │  │   │
│  │  └────────────────────────────┘  │   │
│  └──────────────────────────────────┘   │
│          WIDE SCREEN                    │  ← label-bottom
│  [GAME A]        [🔊]        [GAME B]   │  ← controls-row
└─────────────────────────────────────────┘
```

**States**:
- Default: mode A active (GAME A button dark navy, GAME B inactive)
- Mode B: GAME B button dark burgundy active, GAME A inactive
- Muted: speaker icon shows strikethrough

**CSS**:
```css
.device-outer {
  background: var(--c-frame-body);
  border-radius: var(--frame-radius);
  padding: var(--frame-pad);
  box-shadow: 
    0 4px 6px rgba(0,0,0,0.07),
    0 10px 15px rgba(0,0,0,0.1),
    0 20px 25px rgba(0,0,0,0.15),
    inset 0 1px 0 rgba(255,255,255,0.6);
  max-width: 600px;
  width: 100%;
}

.screen-bezel {
  background: var(--c-frame-bezel);
  border-radius: var(--screen-radius);
  padding: 8px;
}

.screen-inner {
  background: var(--c-lcd-bg);
  border-radius: calc(var(--screen-radius) - 4px);
  aspect-ratio: 4 / 3;
  overflow: hidden;
  position: relative;
}

.label-top, .label-bottom {
  font-family: var(--font-label);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--c-frame-label);
  text-align: center;
  font-size: clamp(10px, 1.8vw, 16px);
}
```

---

### `ModeButton`

**Purpose**: GAME A / GAME B selector embedded in device frame.

```typescript
interface ModeButtonProps {
  mode: 'A' | 'B';
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}
```

**States**:
- Active: background = mode-specific color, text white, `aria-pressed="true"`
- Inactive: background = frame body color, text muted, border visible
- Disabled (during play): reduced opacity, `cursor: not-allowed`
- Focus: 2px outline, offset 2px, color matches active color

**CSS**:
```css
.mode-btn {
  width: var(--btn-size);
  height: var(--btn-size);
  border-radius: 50%;
  font-size: clamp(8px, 1.2vw, 11px);
  font-weight: 700;
  font-family: var(--font-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid var(--c-frame-label);
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;
}

.mode-btn:active { transform: scale(0.95); }
.mode-btn[aria-pressed="true"] { border-color: transparent; }
.mode-btn[disabled] { opacity: 0.4; cursor: not-allowed; }
.mode-btn:focus-visible { outline: 2px solid var(--c-page-text); outline-offset: 2px; }
```

---

### `MuteToggle`

**Purpose**: Speaker icon button in device frame controls row.

**States**:
- Unmuted: speaker-wave SVG icon, opacity 1
- Muted: speaker-slash SVG icon, opacity 0.6

**SVG icons** (inline, 20×20):
```
Unmuted: speaker body + 2 curved waves
Muted: speaker body + diagonal line through it
```

Both icons are drawn using SVG path, fill = `var(--c-frame-label)`.

---

### `ErrorFallback`

**Purpose**: In-device error state when Canvas context fails.

```
Renders inside screen-inner div (keeps device frame intact):
┌────────────────────────────────────────┐
│  [canvas fails silently]               │
│                                        │
│  "Canvas not supported.               │
│   Please use Chrome, Firefox,          │
│   or Safari."                          │
│                                        │
└────────────────────────────────────────┘

Styling: center-aligned, lcd-sprite color, small font (12px),
same background as LCD screen.
```

---

## Layout Patterns

### Page Layout (app/page.tsx)

```
body
└── main.page-layout
    └── section.device-container
        └── DeviceFrame
            └── GameCanvas

.page-layout {
  min-height: 100dvh;
  background: var(--c-page-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.device-container {
  width: 100%;
  max-width: 600px;
}
```

### Responsive Device Sizing

```css
/* Mobile portrait: device fills available width */
@media (max-width: 479px) {
  .device-container { max-width: 100%; padding: 0 8px; }
}

/* Mobile landscape: constrain by height */
@media (max-height: 500px) and (orientation: landscape) {
  .device-container { max-height: 95dvh; }
  .screen-inner { max-height: calc(95dvh - 120px); }
  .label-top, .label-bottom { font-size: 9px; }
}

/* Tablet+ */
@media (min-width: 768px) {
  .device-container { max-width: 520px; }
}

/* Desktop */
@media (min-width: 1024px) {
  .device-container { max-width: 600px; }
}
```

---

## Animation Presets

| Animation | Duration | Easing | Properties | Trigger |
|-----------|----------|--------|------------|---------|
| LCD Ghost fade | 100ms | linear | opacity: 0.12 → 0 | Entity position change |
| MISS text appear | 0ms | — | opacity: 0 → 1 (instant) | Miss event |
| MISS text disappear | 200ms | ease-out | opacity: 1 → 0 | After 1300ms of 1500ms total |
| GAME OVER overlay | 300ms | ease | opacity: 0 → 1 | Third miss |
| PUSH START blink | 500ms | step | opacity: 0 ↔ 1 | Attract / game over |
| Water wave cycle | 1000ms | step | frame: 1 ↔ 2 | Always |
| Button press | 100ms | ease | transform: scale(0.95) | Click/tap |
| Mode button activate | 150ms | ease | background-color | Mode change |

---

## 7-Segment Display Spec

Each digit: 10px wide × 18px tall (at 1× logical canvas scale)
Segment dimensions:

```
    ─────  ← a (top horizontal):    x+2, y,    w=6, h=2
   │     │
   │     │  ← b (top-right vert):   x+8, y+2,  w=2, h=6
   │     │  ← f (top-left vert):    x,   y+2,  w=2, h=6
    ─────  ← g (middle horiz):      x+2, y+8,  w=6, h=2
   │     │
   │     │  ← e (bot-left vert):    x,   y+10, w=2, h=6
   │     │  ← c (bot-right vert):   x+8, y+10, w=2, h=6
    ─────  ← d (bottom horiz):      x+2, y+16, w=6, h=2

Digit → segments [a, b, c, d, e, f, g]:
0 → [1,1,1,1,1,1,0]
1 → [0,1,1,0,0,0,0]
2 → [1,1,0,1,1,0,1]
3 → [1,1,1,1,0,0,1]
4 → [0,1,1,0,0,1,1]
5 → [1,0,1,1,0,1,1]
6 → [1,0,1,1,1,1,1]
7 → [1,1,1,0,0,0,0]
8 → [1,1,1,1,1,1,1]
9 → [1,1,1,1,0,1,1]
```

Three digits rendered at logical x = 172, 185, 198 (center-grouped at canvas center)  
On-segments: `fillStyle = SPRITE_COLOR`  
Off-segments: `fillStyle = LCD_SEGMENT_OFF (rgba(26,26,26,0.05))`

---

## Accessibility Checklist (Per Component)

### DeviceFrame
- [ ] `role="main"` on outer wrapper
- [ ] GAME A/B buttons: `aria-pressed="true/false"`, `aria-label="Game A mode"` / `"Game B mode"`
- [ ] Mute button: `aria-label="Mute"` or `"Unmute"`, `aria-pressed`
- [ ] Focus rings: 2px outline, never `outline: none`

### GameCanvas
- [ ] `<canvas role="img" aria-label="Parachute Game - score: {score}, misses: {misses}">`
- [ ] `aria-live="polite"` region outside canvas for game state announcements
- [ ] `aria-live` updates on: score change, miss, game over, game start

### ModeButton
- [ ] Min size: 28×28px (meets 24×24 WCAG 2.5.8 minimum)
- [ ] Preferred size: 36×36px+
- [ ] Color not sole indicator of active state (also border + label weight change)

### Keyboard Navigation
- [ ] Tab order: Game A → Mute → Game B → (game area not tabbable during play)
- [ ] Arrow keys hijacked by game — document this with visible instructions
- [ ] Enter/Space in focus on device starts game
