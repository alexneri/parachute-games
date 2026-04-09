# Architecture Document: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09  
**Architect**: Principal Engineer

---

## System Overview

Parachute is a purely client-side single-page application. There is no backend, no API, no database, and no user authentication. All game state is in-memory JavaScript. The deployment target is Vercel's Edge Network serving a statically-exported Next.js application.

### Architecture Style
**Static-first SPA** — Next.js builds to static HTML + JS bundles. Game rendering is handled by HTML5 Canvas 2D API driven by a custom game loop. No server-side rendering is needed or used for the game itself; Next.js provides the shell, metadata, and `<head>` structure.

### High-Level Component Map

```
┌─────────────────────────────────────────────────┐
│  Browser (Chrome / Firefox / Safari / Edge)      │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Next.js App Shell (app/page.tsx)         │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  DeviceFrame (React component)      │  │  │
│  │  │  ┌───────────────────────────────┐  │  │  │
│  │  │  │  GameCanvas (React + Canvas)  │  │  │  │
│  │  │  │  - 2D rendering context       │  │  │  │
│  │  │  │  - Entity draw calls          │  │  │  │
│  │  │  └───────────────────────────────┘  │  │  │
│  │  │  ScoreDisplay, ModeSelector, Mute   │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                           │  │
│  │  lib/game/engine.ts (game loop + state)   │  │
│  │  lib/audio/synthesizer.ts (Web Audio API) │  │
│  │  lib/hooks/useGameLoop.ts                 │  │
│  │  lib/hooks/useInput.ts                    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
          │
          │ Static files (CDN)
          ▼
┌──────────────────┐
│  Vercel Edge     │
│  Network (CDN)   │
└──────────────────┘
```

---

## Tech Stack

| Technology | Version | Rationale |
|------------|---------|-----------|
| Next.js | 14.2.x | App Router, static export, zero-config Vercel deployment |
| TypeScript | 5.3.x | Strict mode; game state machines benefit from exhaustive type checking |
| React | 18.3.x | Component model for device frame and UI chrome; Canvas owned via useRef |
| HTML5 Canvas 2D | native | Zero-dependency rendering; correct for discrete-position sprite game |
| Web Audio API | native | Synthesized sounds without audio file assets; keeps bundle tiny |
| Tailwind CSS | 3.4.x | Utility-first for device frame layout and surrounding UI; no runtime CSS |
| Vitest | 1.4.x | Fast unit tests for game logic; compatible with Next.js/ESM |
| @testing-library/react | 14.x | Component tests for React UI shell |
| ESLint | 8.x | Code quality; next/core-web-vitals config |
| Prettier | 3.x | Formatting consistency |

---

## Data Models

### Game State

```typescript
// lib/game/types.ts

export type GameMode = 'A' | 'B';
export type GamePhase = 'attract' | 'playing' | 'paused' | 'miss_flash' | 'game_over';

export interface Position {
  x: number; // 0–4 for boat (discrete), 0–N for helicopter (continuous step index)
  y: number; // Zone index for parachutists (0–2), or row index
}

export interface Parachutist {
  id: string;
  xPosition: number;   // Locked X column (0–4 matching boat columns)
  zone: 0 | 1 | 2;    // Current fall zone
  subZoneProgress: number; // 0.0–1.0 within zone (for ghost effect precision)
  state: 'falling' | 'caught' | 'missed';
}

export interface Helicopter {
  stepIndex: number;   // Current step in traverse path (0 = rightmost)
  totalSteps: number;  // Total steps to cross screen
  cooldownMs: number;  // Time remaining before next traversal
  hasDroppedAt: Set<number>; // Step indices where parachutist was dropped
  isTraversing: boolean;
}

export interface Shark {
  visible: boolean;
  xPosition: number;
  durationMs: number;
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  score: number;
  misses: number;         // 0–3
  boat: {
    position: number;     // 0–4
  };
  helicopter: Helicopter;
  parachutists: Parachutist[];
  shark: Shark;
  missFlashMs: number;    // Remaining ms for MISS text display
  soundEnabled: boolean;
  lastTickMs: number;     // Timestamp of last physics update
}
```

### Render State (Canvas layer)

```typescript
// lib/game/renderer.ts

export interface SpriteGhost {
  spriteKey: SpriteKey;
  x: number;
  y: number;
  opacity: number;    // 0.10–0.15 initial, decays to 0
  spawnedAt: number;  // performance.now() timestamp
}

export interface RenderFrame {
  gameState: GameState;
  ghosts: SpriteGhost[];
  timestamp: number;
}

export type SpriteKey =
  | 'helicopter'
  | 'parachutist_zone0'
  | 'parachutist_zone1'
  | 'parachutist_zone2'
  | 'boat'
  | 'boat_catching'  // Frame during catch animation (1 frame)
  | 'shark'
  | 'water_1'
  | 'water_2'        // Two water animation frames (wave cycle)
  | 'palm_left'
  | 'palm_right';
```

### Constants

```typescript
// lib/game/constants.ts

export const CANVAS_WIDTH = 400;   // Logical canvas width
export const CANVAS_HEIGHT = 300;  // Logical canvas height

export const LCD_BG_COLOR = '#b8c9a3';
export const SPRITE_COLOR = '#1a1a1a';
export const GHOST_OPACITY = 0.12;
export const GHOST_DURATION_MS = 100;

export const BOAT_POSITIONS: number[] = [48, 112, 176, 240, 304]; // X pixels for 5 positions
export const BOAT_Y = 240;

export const HELICOPTER_Y = 36;
export const HELICOPTER_SPAWN_X = 360;
export const HELICOPTER_STEP_PX = 24;
export const HELICOPTER_STEPS = 15;

export const DROP_X_COLUMNS: number[] = [48, 112, 176, 240, 304]; // Same as boat positions

export const ZONE_Y: [number, number, number] = [80, 150, 215];  // Y pixel for zones 0, 1, 2

export const GAME_A_TICK_MS = 500;    // Physics tick interval for Game A
export const GAME_B_TICK_MS = 385;    // ~1.3× faster for Game B
export const GAME_A_HELI_COOL_MS = 2000;
export const GAME_B_HELI_COOL_MS = 1200;
export const GAME_A_MAX_PARA = 2;
export const GAME_B_MAX_PARA = 3;

export const MISS_FLASH_MS = 1500;
export const SHARK_VISIBLE_MS = 800;
export const MAX_MISSES = 3;
export const MAX_SCORE = 999;
```

---

## Module Architecture

### `lib/game/engine.ts` — Game Engine

The heart of the system. Pure TypeScript, no React dependencies. Exports a single `GameEngine` class.

```typescript
export class GameEngine {
  private state: GameState;
  private mode: GameMode;

  constructor(mode: GameMode) { ... }

  // Called every physics tick (~30Hz)
  tick(deltaMs: number): GameState { ... }

  // Player input — called from useInput hook
  moveBoat(direction: 'left' | 'right'): void { ... }

  // Mode change (only valid before game starts)
  setMode(mode: GameMode): void { ... }

  // Restart — resets all state
  restart(): void { ... }

  // Internal
  private updateHelicopter(state: GameState, deltaMs: number): void { ... }
  private updateParachutists(state: GameState, deltaMs: number): void { ... }
  private checkCatch(state: GameState): void { ... }
  private checkMiss(state: GameState): void { ... }
  private spawnParachutist(state: GameState, xColumn: number): void { ... }
}
```

**Design decision**: Engine is a class (not a reducer) because it owns a mutable tick accumulator. The React layer treats it as an imperative object accessed via `useRef`. This is intentional — game loops and React reconciliation don't mix; React renders from snapshots of game state, not from the loop itself.

### `lib/game/renderer.ts` — Canvas Renderer

Stateless function that takes a `RenderFrame` and paints to a Canvas 2D context. Manages ghost list internally via closure.

```typescript
export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private ghosts: SpriteGhost[] = [];

  constructor(ctx: CanvasRenderingContext2D) { ... }

  render(frame: RenderFrame): void {
    this.clearFrame();
    this.drawBackground();
    this.drawPalms();
    this.drawWater(frame.timestamp);
    this.drawGhosts(frame.timestamp);
    this.drawHelicopter(frame.gameState.helicopter);
    this.drawParachutists(frame.gameState.parachutists);
    this.drawBoat(frame.gameState.boat, frame.gameState.phase);
    this.drawShark(frame.gameState.shark);
    this.drawScore(frame.gameState.score);
    this.drawOverlays(frame.gameState);
  }

  private addGhost(spriteKey: SpriteKey, x: number, y: number): void { ... }
  private drawGhosts(now: number): void { ... }
  // ... per-sprite draw methods
}
```

### `lib/game/sprites.ts` — Sprite Definitions

Each sprite is defined as a set of `Path2D` drawing instructions or a function that draws to a Canvas context at a given (x, y) origin. All sprites are vector-defined (no images), keeping bundle size minimal.

```typescript
export type SpriteDraw = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => void;

export const sprites: Record<SpriteKey, SpriteDraw> = {
  helicopter: (ctx, x, y, scale) => { ... },
  parachutist_zone0: (ctx, x, y, scale) => { ... },
  parachutist_zone1: (ctx, x, y, scale) => { ... },
  parachutist_zone2: (ctx, x, y, scale) => { ... },
  boat: (ctx, x, y, scale) => { ... },
  boat_catching: (ctx, x, y, scale) => { ... },
  shark: (ctx, x, y, scale) => { ... },
  water_1: (ctx, x, y, scale) => { ... },
  water_2: (ctx, x, y, scale) => { ... },
  palm_left: (ctx, x, y, scale) => { ... },
  palm_right: (ctx, x, y, scale) => { ... },
};
```

### `lib/audio/synthesizer.ts` — Audio Engine

```typescript
export class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  // Lazy-initialize AudioContext on first user interaction
  private ensureContext(): AudioContext { ... }

  playCatch(): void {
    // 880Hz square wave, 80ms, fast attack/release
  }

  playMiss(): void {
    // 120Hz sawtooth, 300ms, pitch decay to 80Hz
  }

  playGameOver(): void {
    // Arpegio: 880→660→440→220Hz, 250ms per note, total ~1s
  }

  setMuted(muted: boolean): void { this.muted = muted; }
}
```

### `lib/hooks/useGameLoop.ts`

```typescript
export function useGameLoop(engine: React.RefObject<GameEngine>): {
  gameState: GameState;
  renderer: React.RefObject<GameRenderer>;
} {
  // requestAnimationFrame loop
  // Calls engine.tick(delta) for physics
  // Calls renderer.render(frame) for drawing
  // Returns current gameState snapshot for React UI
}
```

### `lib/hooks/useInput.ts`

```typescript
export function useInput(engine: React.RefObject<GameEngine>): void {
  // keydown listener: ArrowLeft, ArrowRight, KeyA, KeyD → engine.moveBoat()
  // touchstart listener: left/right half tap → engine.moveBoat()
  // Enter/Space → engine restart or pause
  // preventDefault on arrow keys to stop page scroll
}
```

---

## Component Tree

```
app/
└── page.tsx
    └── <GamePage>
        └── <DeviceFrame mode={mode} onModeChange={...} muted={...} onMuteToggle={...}>
            ├── <GameCanvas engineRef={...} />     ← owns canvas element
            └── <ModeSelector />                   ← Game A / B buttons
```

### `components/DeviceFrame.tsx`

Pure presentational component. Renders the cream plastic shell via CSS/Tailwind. Props: `mode`, `onModeChange`, `muted`, `onMuteToggle`, `children`.

### `components/GameCanvas.tsx`

Owns the `<canvas>` element. On mount: creates `GameEngine` and `GameRenderer`, starts the game loop. Handles resize observer for DPI-correct canvas scaling.

```typescript
interface GameCanvasProps {
  mode: GameMode;
  onScoreChange?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}
```

---

## Canvas Coordinate System

Logical canvas is always 400×300 pixels internally. The canvas element is CSS-scaled to fit the device frame. This avoids blur on high-DPI screens — we apply `canvas.width = logicalWidth * devicePixelRatio` and `ctx.scale(dpr, dpr)` on mount and resize.

```
(0,0)─────────────────────────────(400,0)
  │  [PALM L]  [HELI traverses →]  [PALM R] │
  │                                          │
  │  Zone 0 (upper air, Y≈80)               │
  │                                          │
  │  Zone 1 (mid air, Y≈150)                │
  │                                          │
  │  Zone 2 (water level, Y≈215)            │
  │──────────────────────────────────────── │
  │  [WATER WAVES]                           │
  │  [BOAT at one of 5 X positions]          │
(0,300)─────────────────────────────(400,300)
```

---

## LCD Ghost Effect Implementation

On every sprite draw, before clearing the old position, we push a `SpriteGhost` entry:

```
onSpriteMove(oldKey, oldX, oldY):
  ghosts.push({ spriteKey: oldKey, x: oldX, y: oldY, opacity: GHOST_OPACITY, spawnedAt: now() })

onRenderFrame(now):
  for ghost in ghosts:
    age = now - ghost.spawnedAt
    if age > GHOST_DURATION_MS: remove from list
    else: draw sprite at ghost.x, ghost.y with opacity = GHOST_OPACITY * (1 - age/GHOST_DURATION_MS)
```

The ghost sprites use the same draw functions, wrapped in `ctx.globalAlpha` adjustment.

---

## 7-Segment Score Display

Implemented as a custom Canvas draw function. Each digit is composed of 7 rectangular segments (a–g, standard 7-segment convention). Segments are drawn as filled rectangles with the `SPRITE_COLOR`. The "off" state of segments is drawn at 5% opacity (matching real LCD segment visibility).

```typescript
const SEGMENTS: Record<string, number[][]> = {
  '0': [1,1,1,0,1,1,1],  // a b c d e f g
  '1': [0,1,1,0,0,0,0],
  // ... 0–9
};

function drawDigit(ctx: CanvasRenderingContext2D, digit: string, x: number, y: number, scale: number): void { ... }
```

---

## Game Loop Timing

Fixed-timestep physics with variable rendering:

```
rAF callback(timestamp):
  delta = timestamp - lastRenderTime
  lastRenderTime = timestamp

  accumulator += delta
  while accumulator >= PHYSICS_TICK_MS:
    engine.tick(PHYSICS_TICK_MS)
    accumulator -= PHYSICS_TICK_MS

  renderer.render({ gameState: engine.getState(), timestamp })
```

This ensures physics is deterministic regardless of frame rate. On a 60fps display, physics ticks at exactly the configured rate. On a 30fps display, physics may tick twice per frame but stays correct.

---

## Authentication & Security

None required. This is a fully public, stateless browser app. No auth, no CORS, no cookies.

Local storage is used only for one optional value:

```typescript
// High score (optional, fails silently if localStorage unavailable)
const HS_KEY = 'parachute_highscore';
export const getHighScore = (): number => parseInt(localStorage.getItem(HS_KEY) ?? '0', 10);
export const setHighScore = (score: number): void => localStorage.setItem(HS_KEY, String(score));
```

---

## Infrastructure & Deployment

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',  // Static export for Vercel Edge
  trailingSlash: true,
  images: { unoptimized: true },
};

export default config;
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
  lighthouse:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: ${{ env.PREVIEW_URL }}
          budgetPath: ./lighthouse-budget.json
```

---

## Error Handling Strategy

### Canvas Not Supported
```typescript
// GameCanvas.tsx
const ctx = canvasRef.current?.getContext('2d');
if (!ctx) {
  setError('Your browser does not support Canvas. Please use Chrome, Firefox, or Safari.');
  return;
}
```

### AudioContext Blocked by Browser
Web Audio requires a user gesture. `AudioSynthesizer.ensureContext()` is called on first input event, not on mount. If AudioContext construction fails, sounds are silently disabled — game continues unaffected.

### requestAnimationFrame Not Available
```typescript
const rAF = window.requestAnimationFrame ?? ((cb: FrameRequestCallback) => setTimeout(cb, 16));
```

### Game State Corruption
Entity arrays are validated on every tick. If `parachutists.length > MAX_PARA`, excess entries are truncated. This guards against rapid-input edge cases that could accumulate entities.

---

## Monitoring & Observability

No backend = no server-side monitoring needed. For v1:
- Vercel Analytics (free tier, no script weight, built-in)
- Web Vitals via `next/vitals` automatic reporting

No error tracking in v1 (Sentry out of scope for a zero-backend game). Console errors are informational only.

---

## File Inventory

```
parachute-game/
├── app/
│   ├── layout.tsx          # Root layout, metadata, viewport
│   ├── page.tsx            # Single page, renders GamePage
│   ├── globals.css         # Tailwind directives + body reset
│   └── favicon.ico
├── components/
│   ├── DeviceFrame.tsx     # Plastic shell UI
│   ├── GameCanvas.tsx      # Canvas mount + game loop orchestration
│   └── ScoreDisplay.tsx    # High score badge (optional, out-of-canvas)
├── lib/
│   ├── game/
│   │   ├── engine.ts       # GameEngine class
│   │   ├── renderer.ts     # GameRenderer class
│   │   ├── sprites.ts      # Sprite draw functions
│   │   ├── constants.ts    # All numeric constants
│   │   └── types.ts        # All TypeScript types
│   ├── audio/
│   │   └── synthesizer.ts  # AudioSynthesizer class
│   └── hooks/
│       ├── useGameLoop.ts  # rAF loop hook
│       └── useInput.ts     # Keyboard + touch input hook
├── __tests__/
│   ├── engine.test.ts
│   ├── renderer.test.ts
│   └── synthesizer.test.ts
├── public/
│   └── (no assets — all sprites are vector)
├── next.config.ts
├── vercel.json
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
├── lighthouse-budget.json
└── package.json
```
