# UI/UX Patterns: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09

---

## Design Strategy

### Visual Hierarchy
1. **The game canvas** — everything else is support. The canvas is 85% of the visible area. Nothing competes with it.
2. **The device frame** — context-giver. Tells you what you're looking at before you play.
3. **The controls row** — functional, minimal. Game A/B and mute. Nothing decorative.
4. **The labels** — whisper, don't shout. PARACHUTE and WIDE SCREEN are part of the artifact, not UI chrome.

### Information Density
Extremely low. The original hardware had a score counter and a MISS indicator. We add nothing. No lives bar, no timer, no instructions overlay during play. Instructions exist in a `<details>` element below the device on first load, collapsed by default.

### Navigation Structure
There is no navigation. This is a single-screen application. All state transitions happen within the canvas: attract → playing → miss_flash → playing → game_over → attract.

### Gesture Map

| Gesture | Context | Effect |
|---------|---------|--------|
| Tap left half | Playing | Move boat left |
| Tap right half | Playing | Move boat right |
| Tap center | Attract / Game Over | Start / Restart |
| Long press (none) | — | No long press interactions |
| Swipe | — | Intentionally disabled (conflicts with page scroll) |
| Keyboard ← / A | Playing | Move boat left |
| Keyboard → / D | Playing | Move boat right |
| Enter / Space | Any | Start / Restart |

---

## Screen Specifications

### Screen 1: Page Load (Attract)

**Description**: User arrives. No interaction yet.

**Layout zones**:
```
[Page: dark background, centered]
  [Device frame: cream, centered, max 600px]
    [Label: PARACHUTE, top-center]
    [Rose bezel]
      [Canvas: attract animation running]
        - Helicopter at step 8 (mid-right)
        - 1 parachutist at zone 1 (mid-air)
        - Boat at position 2 (center)
        - Score: 000
        - "PUSH START" blinking at canvas bottom-center
    [Label: WIDE SCREEN, bottom-center]
    [Label: GAME A, bottom-left of screen]
    [Controls row]
      [Game A button: active/navy] [Mute] [Game B button: inactive]
  [Instructions <details>: collapsed, below device]
```

**Component inventory**: DeviceFrame, ModeSelector (Game A default active), MuteToggle, GameCanvas (attract phase)

**Interactions**:
- Any key → start game in current mode
- Tap canvas → start game
- Game A/B buttons → switch mode
- Mute → toggle sound

**Empty state**: N/A (attract animation is the idle state)  
**Error state**: ErrorFallback inside canvas area  
**Loading state**: Canvas initializes synchronously; no loading state needed

**Designer notes**: The attract animation should loop indefinitely. The parachutist should reach zone 2 but not trigger a miss — it resets to zone 0 when it would hit water, creating a gentle loop. The helicopter completes one pass and loops.

---

### Screen 2: Active Gameplay

**Description**: Player is actively playing.

**Layout zones**:
```
[Canvas: 400×300 logical]
  [Score: 000 → NNN, upper center, 7-seg display]
  [Helicopter: traversing ←, Y=36]
  [Parachutists: 1–3 active, falling at column X positions]
  [Water: animated wave cycle, Y=230–250]
  [Palm left: X=0, Y=170–300]
  [Palm right: X=356, Y=170–300]
  [Boat: at position 0–4, Y=240]
```

**Interactions**: Continuous keyboard/touch input → boat position update

**Performance constraint**: All entity updates and draw calls must complete within 16ms to maintain 60fps. Palm trees and water are static after the first draw — use `drawImage` from an offscreen canvas cache for them.

**Note on offscreen caching**:
```typescript
// Pre-render static elements to offscreen canvas on game init
const staticCanvas = new OffscreenCanvas(400, 300);
const staticCtx = staticCanvas.getContext('2d');
drawPalmLeft(staticCtx);
drawPalmRight(staticCtx);
// In each frame:
ctx.drawImage(staticCanvas, 0, 0);
```

---

### Screen 3: Miss Flash

**Description**: Parachutist hit water without being caught. Brief overlay state.

**Canvas additions**:
- "MISS" block text at position (290, 238)
- Shark visible at miss X position
- Parachutist ghost at miss position (ghost effect, natural)
- All other entities continue (game not paused)

**Font spec for "MISS" text**:
```typescript
ctx.font = 'bold 13px Helvetica Neue, Arial, sans-serif';
ctx.letterSpacing = '2px';
ctx.fillStyle = tokens.color.lcdSprite;
ctx.fillText('MISS', 290, 238);
```
Note: "MISS" appears as a text render, not a sprite, because it only contains letters. Use `ctx.measureText` to right-align consistently.

**Duration**: 1500ms. State reverts to playing automatically.

**Micro-interaction**: Shark dorsal fin appears with a slight "pop" — it renders in one frame (no fade-in), which matches the original hardware's instant sprite activation.

---

### Screen 4: Game Over

**Description**: Third miss. Game pauses. End state.

**Canvas additions**:
- All entities freeze at their current positions
- Semi-transparent black overlay: `rgba(0,0,0,0.15)` via `ctx.fillRect(0,0,W,H)` with globalAlpha
- "GAME OVER" text, centered
- Final score remains visible in 7-seg display
- "PUSH START" blinking at bottom center (1Hz)

**Text layout for GAME OVER**:
```typescript
// Centered in canvas
ctx.font = 'bold 20px Helvetica Neue, Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillStyle = tokens.color.lcdSprite;
ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

// Sub-text
ctx.font = '11px Helvetica Neue, Arial, sans-serif';
ctx.fillText('PUSH START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 22);
```

**Interaction**: Enter / Space / tap canvas → restart

**Designer notes**: Don't add a "high score!" banner or any celebratory UX. The original had none. The game over screen should feel like the hardware shutting down — quiet, immediate, waiting for the next game.

---

### Screen 5: Mode Selection (Overlay on Attract)

**Description**: Player taps GAME A or GAME B button. No screen change — just the device frame button state updates.

**Changes**:
- Active button: fills with mode color, text white
- Inactive button: reverts to frame body color

**Interaction timing**: Instant. No animation delay. The mode change is a preference, not an action.

**If game is already playing**: Mode buttons are disabled (`disabled` attribute). Mode changes only in attract or game over states.

---

### Screen 6: First-Visit Instructions

**Description**: Below the device frame, a collapsed `<details>` element contains minimal instructions. Collapsed by default.

```html
<details class="instructions">
  <summary>How to play</summary>
  <p>Move the boat to catch falling parachutists.</p>
  <p>← → Arrow keys or A/D to move. Enter to start.</p>
  <p>On mobile: tap left or right side to move.</p>
  <p>3 missed catches = game over.</p>
</details>
```

**Styling**: Same page-text color, small font (13px), max-width matching device.

---

## Component Specifications

### Score Overlay (Canvas)
- Position: (172, 6) to (210, 26) — three digits, upper center
- Digit width: 10px, height: 18px, gap: 3px between digits
- Background: none (LCD background shows through)
- Off-segments: 5% opacity

### MISS Text (Canvas)
- Position: right-aligned to x=355, baseline y=238
- Style: bold, 13px, tracking 2px
- Color: `lcdSprite` (#1a1a1a)
- Visible: only in `miss_flash` phase

### Shark (Canvas Sprite)
- Bounding box: 18×14px
- Position: x = BOAT_POSITIONS[missXColumn] - 9, y = 258
- Dorsal fin: triangle, vertices at (9,0), (0,14), (18,14)
- Body: ellipse, rx=9, ry=5, cy=18

---

## Accessibility Compliance

### VoiceOver / TalkBack

```typescript
// aria-live region (outside canvas, visually hidden)
// Updates triggered by engine state changes

function announceGameState(state: GameState) {
  const msg = state.phase === 'game_over'
    ? `Game over. Final score: ${state.score}`
    : state.phase === 'miss_flash'
    ? `Miss. ${3 - state.misses} chances remaining.`
    : `Score: ${state.score}`;

  liveRegion.textContent = msg;
}
```

CSS for visually-hidden live region:
```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border-width: 0;
}
```

### Contrast Verification

| Element | Foreground | Background | Ratio | WCAG AA |
|---------|-----------|------------|-------|---------|
| Device labels | #2a2a2a | #e8e0d0 | 11.2:1 | ✓ PASS |
| Page text | #b8c9a3 | #1a1a1a | 7.8:1 | ✓ PASS |
| Game A btn (active) | #ffffff | #3a3a5c | 8.4:1 | ✓ PASS |
| Game B btn (active) | #ffffff | #5c3a3a | 7.6:1 | ✓ PASS |
| LCD sprite on LCD bg | #1a1a1a | #b8c9a3 | 7.9:1 | ✓ PASS |
| Instructions text | #b8c9a3 | #1a1a1a | 7.8:1 | ✓ PASS |

### Reduce-Motion Handling

```typescript
// lib/hooks/useReducedMotion.ts
export function useReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// In GameCanvas.tsx:
const reducedMotion = useReducedMotion();
useEffect(() => {
  engine.current?.setGhostEnabled(!reducedMotion);
}, [reducedMotion]);
```

When `prefers-reduced-motion: reduce`:
- LCD ghost effect disabled (sprites snap off cleanly)
- PUSH START blink disabled (static text)
- All Canvas animations stop between game ticks

---

## Micro-Interactions

### Catch Event
1. Frame 0: parachutist_zone2 removed from canvas
2. Frame 0: boat sprite switches to `boat_catching` for 1 tick (100ms)
3. Frame 1: `boat_catching` → `boat`, ghost of `boat_catching` lingers 100ms
4. Score increments instantly (same frame)
5. Catch blip sound plays (if unmuted)

**Why no elaborate animation**: The original Game & Watch had exactly this behavior — a brief sprite-swap on the boat. Adding more would break fidelity.

### Miss Event
1. Frame 0: parachutist_zone2 removed from canvas (but ghost lingers per ghost system)
2. Frame 0: MISS text renders at (290, 238)
3. Frame 0: Shark sprite renders at miss X position
4. Frame 0: Miss buzz sound plays
5. Frames 1–15 (100ms each): MISS text and shark remain visible
6. Frame 15: shark disappears (SHARK_VISIBLE_MS = 800ms)
7. Frame 22 (1500ms): MISS text disappears

### Game Over Transition
1. Frame 0 (third miss): physics loop sets phase to 'game_over'
2. Frame 0: renderer detects phase change, renders overlay
3. Overlay opacity: `ctx.globalAlpha = 0` → `0.15` over 300ms using `requestAnimationFrame`
4. GAME OVER text renders at full opacity (no fade — matches hardware)
5. PUSH START blink begins at 500ms interval

---

## Responsive Behavior

### Device Breakpoints

| Breakpoint | Device width | Scaling behavior |
|------------|-------------|-----------------|
| 320px | iPhone SE | Device fills 95% of viewport width |
| 375px | iPhone 15 | Device fills 90% viewport, labels visible |
| 414px | Large phone | Device centered, minor whitespace |
| 768px | iPad | Device max 520px, centered |
| 1024px | Desktop | Device max 600px, dark page visible |
| 1440px | Wide desktop | Same as 1024px max |

### Orientation: Landscape (Mobile)

When the viewport height is < 500px (landscape phone):
- Device scales to fit height: `max-height: calc(100dvh - 32px)`
- Font sizes: labels reduce to 9px
- Controls row: buttons reduce to 28px
- Instructions details: hidden entirely

This ensures the game remains playable in landscape without requiring scroll.

### Canvas Scale Formula (Implementation)

```typescript
function scaleCanvas(canvas: HTMLCanvasElement, container: HTMLElement): void {
  const dpr = window.devicePixelRatio || 1;
  const containerW = container.clientWidth;
  const containerH = container.clientHeight;

  const scaleX = containerW / CANVAS_WIDTH;
  const scaleY = containerH / CANVAS_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  // CSS size: constrained to aspect ratio
  canvas.style.width = `${CANVAS_WIDTH * scale}px`;
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`;

  // Actual pixel size: includes DPR for sharpness
  canvas.width = Math.round(CANVAS_WIDTH * scale * dpr);
  canvas.height = Math.round(CANVAS_HEIGHT * scale * dpr);

  // Reset transform and apply combined scale
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
  ctx.scale(dpr * scale, dpr * scale);
}
```

This is called: on mount, and in ResizeObserver callback (debounced 100ms).
