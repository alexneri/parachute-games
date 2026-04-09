# Front-End Specification: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09

---

## Design Token System

### Colors

```css
/* LCD Display */
--color-lcd-bg: #b8c9a3;           /* Pale sage green — the screen */
--color-lcd-sprite: #1a1a1a;       /* Near-black silhouette sprites */
--color-lcd-ghost: rgba(26,26,26,0.12); /* Ghost persistence overlay */
--color-lcd-segment-off: rgba(26,26,26,0.05); /* 7-seg off-state */

/* Device Frame */
--color-frame-body: #e8e0d0;       /* Cream/off-white plastic */
--color-frame-inner: #c47a7a;      /* Rose/mauve screen surround */
--color-frame-label: #2a2a2a;      /* Label text */
--color-frame-button-a: #3a3a5c;   /* Game A button — dark navy */
--color-frame-button-b: #5c3a3a;   /* Game B button — dark burgundy */
--color-frame-button-active: #ffffff;

/* App Shell */
--color-page-bg: #1a1a1a;          /* Dark background behind device */
--color-page-text: #b8c9a3;        /* Inverted LCD green for UI text */
```

### Typography

```css
/* Device labels — closest free match to original hardware */
--font-label: 'Helvetica Neue', 'Arial', sans-serif;
--font-score: monospace; /* 7-segment is drawn on Canvas, not DOM text */
--font-ui: system-ui, sans-serif;

/* Label sizes (relative to frame width) */
--label-title-size: clamp(10px, 1.8vw, 18px);
--label-subtitle-size: clamp(8px, 1.2vw, 12px);
```

### Spacing

```css
--frame-padding: clamp(12px, 3vw, 32px);
--screen-radius: 8px;
--frame-radius: 16px;
--button-size: clamp(28px, 5vw, 44px);
```

### Animation / Timing

```css
--ghost-duration: 100ms;
--miss-flash-duration: 1500ms;
--shark-visible-duration: 800ms;
--catch-frame-duration: 100ms;  /* Boat "catching" sprite frame */
--game-over-fade-in: 300ms;
```

---

## Screen Hierarchy

```
App (dark background)
└── Device (cream frame, responsive scaling)
    ├── Title Label: "PARACHUTE"
    ├── LCD Screen (rose bezel + canvas)
    │   ├── [GAME STATE: attract]   — idle animation, press-to-start
    │   ├── [GAME STATE: playing]   — active gameplay
    │   ├── [GAME STATE: miss_flash] — MISS overlay + shark
    │   └── [GAME STATE: game_over] — GAME OVER overlay + score
    ├── Subtitle Label: "WIDE SCREEN"
    └── Controls Row
        ├── [GAME A button]
        ├── [MUTE toggle]
        └── [GAME B button]
```

---

## Screen Specifications

### Screen 1: Attract Mode
**Trigger**: App load, before first input

**Layout**:
- LCD background renders at full opacity
- Helicopter is visible at position 3 (mid-right)
- One parachutist falls slowly in zone 0 (top)
- Boat is at center position (2)
- Score shows `000`
- A subtle "PUSH START" text flashes every 1s in LCD color at bottom-center of canvas

**Interaction**:
- Any key or tap transitions to `playing` state (if mode is already selected)
- GAME A / GAME B buttons select mode (visual indicator updates)

**Empty state**: N/A — attract animation always runs

---

### Screen 2: Playing State
**Trigger**: After start input

**Layout — Canvas zones (400×300 logical px)**:
```
Y   0 ┬───────────────────────────────────────
      │ [Score: center, Y=12]
  36  │ [Helicopter traverses ← at Y=36]
      │
  80  │ Zone 0: Parachutist with open parachute (slow fall)
      │
 150  │ Zone 1: Parachutist mid-air (still open)
      │
 215  │ Zone 2: Parachutist approaching water (parachute collapsing)
      │
 230  │ [Water waves — animated 2-frame cycle at 1Hz]
      │ [Palm tree left: X=0–40, Y=170–300]
      │ [Palm tree right: X=360–400, Y=170–300]
 240  │ [Boat: Y=240, one of 5 X positions]
      │
 280  │ [Shark: visible at miss X, Y≈258]
 300  ┴───────────────────────────────────────
```

**UI Chrome (outside canvas)**:
- Device frame labels visible
- Active mode button shows highlight
- Mute icon in lower-right of frame

**Interactions**:
- ← / A / tap-left: move boat left one position
- → / D / tap-right: move boat right one position
- Enter / Space / tap-center: pause

---

### Screen 3: Miss Flash State
**Trigger**: Parachutist reaches water with no catch

**Canvas overlays**:
- "MISS" text renders at canvas position (290, 240) — bottom-right quadrant
- Text: `SPRITE_COLOR`, custom block letter style (not system font)
- Shark sprite appears at miss X position
- Ghost of parachutist at miss position lingers
- Game loop continues (other parachutists still fall)

**Duration**: 1500ms, then clears automatically

---

### Screen 4: Game Over State
**Trigger**: Third miss

**Canvas**:
- All entities freeze
- Semi-transparent dark overlay: `rgba(0,0,0,0.15)` fills canvas
- "GAME OVER" text centered: 32px equivalent, `SPRITE_COLOR`
- Final score remains visible
- "PUSH START" text flashes at bottom center

**Frame chrome**:
- Mode buttons remain accessible (player can change mode before restart)

---

## Component Specifications

### `<DeviceFrame />`

```
Props:
  mode: GameMode               'A' | 'B'
  onModeChange: (m) => void
  muted: boolean
  onMuteToggle: () => void
  children: ReactNode          (contains <GameCanvas />)

Visual structure (CSS):
  .device-outer   — cream bg, border-radius 16px, drop-shadow
    .label-top    — "PARACHUTE" centered, Helvetica, 14px
    .screen-bezel — rose background, padding 8px, border-radius 8px
      .screen-inner — LCD bg, overflow hidden, aspect-ratio 4/3
        children    — <canvas /> lives here
    .label-bottom — "WIDE SCREEN" centered
    .controls-row — flex row, space-between
      .btn-game-a
      .btn-mute
      .btn-game-b

Tailwind classes (approximate):
  device-outer: bg-[#e8e0d0] rounded-2xl shadow-2xl p-[clamp(12px,3vw,32px)] max-w-[600px] w-full mx-auto
  screen-bezel:  bg-[#c47a7a] rounded-lg p-2
  screen-inner:  bg-[#b8c9a3] rounded aspect-[4/3] overflow-hidden relative
```

**States**:
- Mode A active: `.btn-game-a` has background `#3a3a5c`, text white
- Mode B active: `.btn-game-b` has background `#5c3a3a`, text white
- Muted: mute icon shows strikethrough speaker SVG

---

### `<GameCanvas />`

```
Props:
  mode: GameMode
  onPhaseChange?: (phase: GamePhase) => void

Refs:
  canvasRef: RefObject<HTMLCanvasElement>
  engineRef: RefObject<GameEngine>
  rendererRef: RefObject<GameRenderer>
  rAFRef: RefObject<number>

Mount behavior:
  1. Get 2D context from canvasRef
  2. Set canvas dimensions accounting for devicePixelRatio
  3. Initialize GameEngine(mode)
  4. Initialize GameRenderer(ctx)
  5. Start rAF loop

ResizeObserver:
  On container resize: recalculate scale factor, update canvas dimensions, maintain aspect ratio

Canvas sizing formula:
  const scale = Math.min(containerWidth / CANVAS_WIDTH, containerHeight / CANVAS_HEIGHT)
  canvas.style.width = CANVAS_WIDTH * scale + 'px'
  canvas.style.height = CANVAS_HEIGHT * scale + 'px'
  canvas.width = CANVAS_WIDTH * scale * dpr
  canvas.height = CANVAS_HEIGHT * scale * dpr
  ctx.scale(dpr * scale, dpr * scale)
```

**Accessibility**:
- `<canvas role="img" aria-label="Parachute Game & Watch recreation">`
- Keyboard instructions visible above/below device frame on desktop

---

### `<ModeSelector />`

```
Props:
  mode: GameMode
  onChange: (m: GameMode) => void
  disabled: boolean   (true when game is playing)

Renders two buttons inside DeviceFrame controls row.
Buttons use aria-pressed for active state.
Tab-focusable. Space/Enter activates.
```

---

## Sprite Design Reference

All sprites are vector-drawn on Canvas. Each sprite is a function that draws to a CanvasRenderingContext2D using fillRect, arc, and lineTo calls. Below are the logical descriptions for implementation reference.

### Helicopter
- Body: elongated horizontal rectangle (40×14px at 1× scale)
- Rotor: three thin rectangles above body, centered, extending 20px each side
- Tail rotor: small rectangle at tail
- Skids: two thin rectangles below body

### Parachutist Zone 0 (upper air)
- Parachute canopy: large semicircle arc (28px radius)
- Suspension lines: four thin lines from canopy edge to harness
- Figure: small person silhouette hanging below (head circle, torso rect, arms out)

### Parachutist Zone 1 (mid air)
- Identical to Zone 0 but slightly smaller canopy (canopy partially deflating)

### Parachutist Zone 2 (approaching water)
- No canopy (collapsed)
- Figure in free-fall pose (arms up, legs bent)

### Boat
- Hull: trapezoid (wider at waterline, narrower at bow)
- Oarsman: person silhouette seated, arms extended with oars
- Oars: thin rectangles extending each side

### Boat Catching
- Same as Boat, but figure has arms raised upward
- Used for one tick on catch event

### Shark
- Dorsal fin: triangle protruding above water line
- Body: oval partially below water line

### Water (2-frame)
- Frame 1: wavy horizontal lines (three wave crests)
- Frame 2: offset wave crests (creates animation illusion)

### Palm Trees (left/right)
- Trunk: curved thin rectangle
- Fronds: 4–5 elongated leaf shapes radiating from top
- Left palm leans right, right palm leans left (matching original)

---

## Accessibility Requirements (WCAG 2.2 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements reachable via Tab; game playable via arrow keys |
| Touch targets | Mode buttons, mute button ≥ 44×44px |
| Color contrast (UI chrome) | Label text on frame: 7:1 (meets AA) |
| Screen reader | canvas has aria-label; buttons have aria-label; game state change announced via aria-live region |
| Focus indicators | Visible focus ring on all buttons |
| Reduced motion | Game animation pauses if `prefers-reduced-motion: reduce` detected |
| Color not sole indicator | Mode state uses both color AND border/text change |

```typescript
// Detect prefers-reduced-motion
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) {
  engine.setGhostEnabled(false);  // Disable LCD ghost effect
}
```

---

## Responsive Design Guidelines

### Breakpoints

```
Mobile portrait:   320px –  479px  — Full width, no frame chrome visible outside canvas
Mobile landscape:  480px –  767px  — Device scaled to viewport height
Tablet:            768px – 1023px  — Device centered, max 520px wide
Desktop:           1024px+         — Device max 600px wide, centered on dark bg
```

### Scaling Behavior

```
< 480px:   Device fills viewport width. Controls row stacks if needed.
480–768:   Device scales to 85% viewport height. Centered.
768–1024:  Device max-width: 520px. Centered. Background visible.
> 1024px:  Device max-width: 600px. Centered. Background shows full extent.
```

### Orientation Handling
- Portrait: standard layout
- Landscape on mobile: device scales to fit height, instruction text hides

---

## Empty, Loading, and Error States

### Loading State
Next.js static export = no loading state needed. Canvas initializes synchronously on mount. If canvas context fails (extremely rare), show:
```
<div class="error-fallback">
  Canvas not supported. Please use a modern browser.
</div>
```
Styled to match device frame color scheme.

### Attract (Idle) State
Defined above — idle helicopter + parachutist animation. This IS the empty state.

### Game Over State
Defined above — GAME OVER overlay with restart prompt.

### Error State (unexpected)
```typescript
// GameCanvas.tsx
<ErrorBoundary fallback={<DeviceError message="An error occurred. Refresh to restart." />}>
  <GameCanvas />
</ErrorBoundary>
```
`DeviceError` renders inside the device frame with the LCD aesthetic maintained.
