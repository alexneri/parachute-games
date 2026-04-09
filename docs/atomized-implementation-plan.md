# Atomized Implementation Plan: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09  
**Source documents**: brief.md, prd.md, architecture.md, front-end-spec.md

---

## Audit Findings

**Gap 1 — Sprite dimensions not finalized in architecture.md**  
Architecture.md defines sprite keys and draw function signatures but defers actual pixel geometry to implementation. Task T-2.2 must finalize sprite dimensions before renderer tests can be written. Mitigation: provide reference measurements table in T-2.2 acceptance criteria.

**Gap 2 — Canvas scale factor and DPI handling are cross-cutting**  
Both GameCanvas.tsx (FR15) and renderer.ts (FR1) depend on the same scale calculation. This must be settled in T-2.1 before T-2.2 begins, or sprite positions will be wrong at non-1× DPR.

**Gap 3 — Ghost effect requires renderer access during engine tick**  
The LCD ghost system (FR2) sits between the engine (which knows when entities move) and the renderer (which knows how to draw). Architecture places ghost tracking in the renderer. This is correct but means the renderer must be stateful (not a pure function). This is already the design — confirming it as intentional.

**Gap 4 — Audio autoplay policy bridging**  
FR12 and Story 3.1 correctly note that AudioContext must initialize on first user interaction. useInput.ts must call `synthesizer.ensureContext()` on first keydown/touchstart, not in a useEffect. If this is done in useEffect on mount, Safari will block audio.

**Gap 5 — No explicit test for 3-miss wrapping**  
PRD says score wraps at 999. Architecture says it. Neither specifies: what happens to miss counter after game over + restart? It must reset to 0. This is obvious but needs an explicit test case in T-1.7.

---

## Parallel Execution Tracks

```
Track A — Core Engine (no React, no Canvas)
  T-0.1 → T-1.1 → T-1.2 → T-1.3 → T-1.4 → T-1.5 → T-1.6 → T-1.7

Track B — Rendering Pipeline (depends on T-0.1 for types only)
  T-0.1 → T-2.1 → T-2.2 → T-2.3 → T-2.4

Track C — React Shell (depends on T-2.1 for canvas dimensions)
  T-2.1 → T-2.5 → T-4.2 → T-4.3

Track D — Audio (independent, depends on T-0.1 types only)
  T-0.1 → T-3.1 → T-3.2

Track E — Integration (depends on Tracks A, B, C complete)
  T-1.7 + T-2.4 + T-2.5 → T-INT-1 → T-INT-2

Track F — Deployment (can begin after T-0.1)
  T-5.1 → T-5.2
```

---

## Task List

---

### T-0.1 — Project Scaffold

**Files to create**:
```
package.json
tsconfig.json
next.config.ts
tailwind.config.ts
vitest.config.ts
.eslintrc.json
.prettierrc
.gitignore
app/layout.tsx
app/page.tsx
app/globals.css
lib/game/types.ts
lib/game/constants.ts
```

**Files to modify**: None

**Acceptance criteria**:
- [ ] `npm run dev` serves the app at localhost:3000 without errors
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] `lib/game/types.ts` exports: `GameMode`, `GamePhase`, `Position`, `Parachutist`, `Helicopter`, `Shark`, `GameState`, `SpriteKey`, `SpriteGhost`, `RenderFrame`
- [ ] `lib/game/constants.ts` exports all values from architecture.md constants section
- [ ] TypeScript strict mode is enabled

**Dependencies**: None  
**FR/NFR**: NFR4, NFR7 (baseline)

---

### T-1.1 — Game Engine: Core State Machine

**Files to create**:
```
lib/game/engine.ts
__tests__/engine.test.ts
```

**Files to modify**: None

**Acceptance criteria**:
- [ ] `GameEngine` class instantiates with mode 'A' or 'B'
- [ ] `engine.getState()` returns a valid `GameState` with all required fields
- [ ] `engine.restart()` resets score to 0, misses to 0, phase to 'attract'
- [ ] `engine.setMode('B')` only works when phase is 'attract'
- [ ] Initial phase is 'attract'
- [ ] Tests: constructor, getState shape, restart, setMode guard

**Dependencies**: T-0.1  
**FR/NFR**: FR6, FR9, FR10

---

### T-1.2 — Game Engine: Helicopter Mechanics

**Files to modify**: `lib/game/engine.ts`, `__tests__/engine.test.ts`

**Implementation**:
- Add `updateHelicopter(state, deltaMs)` private method
- Helicopter starts at stepIndex = HELICOPTER_STEPS (rightmost)
- Each tick decrements stepIndex by 1
- At stepIndex = 7 and stepIndex = 3, spawn parachutist if under max count
- When stepIndex reaches 0: set `isTraversing = false`, start `cooldownMs`
- After cooldown: reset stepIndex, set `isTraversing = true`, clear `hasDroppedAt`

**Acceptance criteria**:
- [ ] Helicopter traverses from right to left over HELICOPTER_STEPS ticks
- [ ] Parachutists spawned at correct steps
- [ ] Respawn cooldown is GAME_A_HELI_COOL_MS for mode A, GAME_B_HELI_COOL_MS for mode B
- [ ] Multiple parachutists cannot be spawned beyond MAX_PARA limit
- [ ] Tests cover: full traverse cycle, spawn suppression at max, cooldown timing

**Dependencies**: T-1.1  
**FR/NFR**: FR3

---

### T-1.3 — Game Engine: Parachutist Fall

**Files to modify**: `lib/game/engine.ts`, `__tests__/engine.test.ts`

**Implementation**:
- Add `updateParachutists(state, deltaMs)` private method
- Each tick: advance `subZoneProgress` by per-zone fall rate
- When `subZoneProgress >= 1.0`: increment zone, reset subZoneProgress
- Zone 2 → water: trigger catch check (see T-1.5)

**Fall rates** (subZoneProgress per tick):
- Zone 0: 0.25 per tick (Game A) / 0.33 (Game B)
- Zone 1: 0.33 per tick (Game A) / 0.43 (Game B)
- Zone 2: 0.50 per tick (Game A) / 0.65 (Game B)

**Acceptance criteria**:
- [ ] Parachutist advances through zones 0→1→2 at correct rates
- [ ] X position is immutable once spawned
- [ ] State is `'falling'` until catch or miss resolves it
- [ ] Game B fall rates are ~1.3× Game A rates
- [ ] Tests: zone progression, X immutability, rate comparison A vs B

**Dependencies**: T-1.2  
**FR/NFR**: FR4

---

### T-1.4 — Game Engine: Boat Movement

**Files to modify**: `lib/game/engine.ts`, `__tests__/engine.test.ts`

**Implementation**:
- `moveBoat('left')`: position = Math.max(0, position - 1)
- `moveBoat('right')`: position = Math.min(4, position + 1)
- Input ignored if phase is not 'playing'

**Acceptance criteria**:
- [ ] Boat moves left/right one step per call
- [ ] Boat cannot go below 0 or above 4
- [ ] Input is a no-op when phase !== 'playing'
- [ ] Tests: boundary conditions, playing-only guard

**Dependencies**: T-1.1  
**FR/NFR**: FR5, FR14

---

### T-1.5 — Game Engine: Catch & Miss Logic

**Files to modify**: `lib/game/engine.ts`, `__tests__/engine.test.ts`

**Implementation**:
- `checkCatch(state)`: for each parachutist in zone 2 at subZoneProgress >= 0.85:
  - if parachutist.xPosition === state.boat.position: catch event
  - else: miss event
- On catch: set parachutist.state = 'caught', increment score
- On miss: set parachutist.state = 'missed', increment misses, set missFlashMs, set shark position

**Acceptance criteria**:
- [ ] Catch fires when X positions match in zone 2
- [ ] Miss fires when X positions don't match
- [ ] Score increments on catch (max 999)
- [ ] Misses increments on miss (max 3)
- [ ] missFlashMs set to MISS_FLASH_MS on miss
- [ ] shark.visible = true, shark.xPosition = parachutist X on miss
- [ ] Tests: exact match, off-by-one (no catch), score wrap at 999, miss count to 3

**Dependencies**: T-1.3, T-1.4  
**FR/NFR**: FR6, FR7

---

### T-1.6 — Game Engine: Miss Flash & Shark Lifecycle

**Files to modify**: `lib/game/engine.ts`, `__tests__/engine.test.ts`

**Implementation**:
- Each tick: decrement `missFlashMs` by deltaMs
- When `missFlashMs <= 0`: clear MISS state, clear shark visibility (if misses < 3)
- Shark: visible for SHARK_VISIBLE_MS from miss event

**Acceptance criteria**:
- [ ] MISS text state cleared after MISS_FLASH_MS
- [ ] Shark visibility clears after SHARK_VISIBLE_MS
- [ ] Multiple misses within flash window extend flash (last miss wins)
- [ ] Tests: timing teardown, multiple miss edge case

**Dependencies**: T-1.5  
**FR/NFR**: FR7

---

### T-1.7 — Game Engine: Game Over & Restart

**Files to modify**: `lib/game/engine.ts`, `__tests__/engine.test.ts`

**Implementation**:
- When misses reaches MAX_MISSES (3): set phase to 'game_over'
- In 'game_over' phase: all update methods are no-ops (physics frozen)
- `engine.restart()`: reset all state to initial, phase = 'attract'

**Acceptance criteria**:
- [ ] Third miss sets phase to 'game_over'
- [ ] Engine tick is a no-op in game_over phase
- [ ] restart() resets: score=0, misses=0, parachutists=[], phase='attract'
- [ ] restart() also resets helicopter and shark state
- [ ] Tests: game over trigger, no-op tick, full restart verification

**Dependencies**: T-1.5, T-1.6  
**FR/NFR**: FR10

---

### T-2.1 — Renderer: Canvas Foundation & DPI Handling

**Files to create**:
```
lib/game/renderer.ts
components/GameCanvas.tsx
lib/hooks/useGameLoop.ts
```

**Implementation**:
- `GameRenderer` class: takes CanvasRenderingContext2D in constructor
- `renderer.render(frame)`: clears canvas, calls all draw methods in order
- `useGameLoop` hook: rAF loop with fixed-timestep accumulator
- Canvas DPI setup: `canvas.width = logicalW * dpr; ctx.scale(dpr, dpr)`

**Acceptance criteria**:
- [ ] Canvas renders LCD background color `#b8c9a3` on first frame
- [ ] Canvas scales correctly at 1×, 2× (Retina), and 3× DPR
- [ ] rAF loop runs; calls engine.tick and renderer.render each frame
- [ ] Loop pauses when tab is hidden (visibilitychange event)
- [ ] ResizeObserver recalculates scale without corrupting game state

**Dependencies**: T-0.1, T-1.1  
**FR/NFR**: FR1, FR15, NFR1

---

### T-2.2 — Renderer: Sprite System

**Files to create**:
```
lib/game/sprites.ts
```

**Files to modify**: `lib/game/renderer.ts`

**Sprite pixel dimensions (at 1× logical scale, 400×300 canvas)**:

| Sprite | W | H | Notes |
|--------|---|---|-------|
| helicopter | 52 | 24 | Including rotor sweep |
| parachutist_zone0 | 24 | 40 | Canopy radius 14px |
| parachutist_zone1 | 22 | 36 | Slightly smaller canopy |
| parachutist_zone2 | 16 | 22 | No canopy, compact |
| boat | 48 | 20 | Including oars width |
| boat_catching | 48 | 24 | Arms raised +4px height |
| shark | 18 | 14 | Dorsal fin + body |
| water_1/2 | 400 | 20 | Full width |
| palm_left | 44 | 100 | |
| palm_right | 44 | 100 | |

**Acceptance criteria**:
- [ ] All 11 sprite keys have draw functions
- [ ] Sprites render at correct positions in a visual inspection test
- [ ] Sprite color is SPRITE_COLOR (`#1a1a1a`)
- [ ] No sprite draws outside its bounding box (Path2D clip per sprite)
- [ ] Tests: render all sprites, verify fillStyle, no console errors

**Dependencies**: T-2.1  
**FR/NFR**: FR1, FR2 (partial)

---

### T-2.3 — Renderer: LCD Ghost Effect

**Files to modify**: `lib/game/renderer.ts`

**Implementation**:
- `ghostList: SpriteGhost[]` maintained in renderer
- Before redrawing a sprite at new position: push old position to ghostList
- `drawGhosts(now)`: iterate list, compute fade, draw at reduced opacity, prune expired
- Use `ctx.save() / ctx.globalAlpha = opacity / ctx.restore()` pattern

**Acceptance criteria**:
- [ ] Moving boat creates ghost at previous position
- [ ] Ghost opacity decays from 0.12 to 0 over 100ms
- [ ] Ghost duration is within 80–120ms window
- [ ] Expired ghosts are pruned each frame
- [ ] Test: simulate entity move, verify ghost list populated, verify opacity decay

**Dependencies**: T-2.2  
**FR/NFR**: FR2

---

### T-2.4 — Renderer: Score, Overlays & 7-Segment Display

**Files to create**: (add to renderer.ts)

**Implementation**:
- `drawScore(score)`: draws three 7-segment digits at (172, 8) to (228, 28)
- Segment geometry: 14px tall × 8px wide per digit
- Off-segments drawn at 5% opacity
- `drawMissText()`: "MISS" in block-letter canvas drawing at (290, 240)
- `drawGameOver()`: semi-transparent overlay + "GAME OVER" + "PUSH START" flashing

**Acceptance criteria**:
- [ ] Score 0–999 renders correctly (test: 0, 1, 99, 100, 999)
- [ ] Off-segments visible at ~5% opacity
- [ ] MISS text visible during miss_flash phase only
- [ ] GAME OVER overlay renders at correct opacity
- [ ] PUSH START text flashes at 1Hz interval

**Dependencies**: T-2.2  
**FR/NFR**: FR8, FR7, FR10

---

### T-2.5 — React Shell: DeviceFrame & Layout

**Files to create**:
```
components/DeviceFrame.tsx
components/ScoreDisplay.tsx
```

**Files to modify**: `app/page.tsx`, `app/globals.css`

**Implementation**:
- `DeviceFrame`: pure CSS/Tailwind component with children slot
- Dark page background, device centered, responsive scaling as per front-end-spec
- PARACHUTE / WIDE SCREEN labels
- GAME A / GAME B buttons with aria-pressed
- Mute toggle button

**Acceptance criteria**:
- [ ] Device renders in cream color on dark background
- [ ] Rose bezel visible around canvas
- [ ] Labels: "PARACHUTE" top-center, "WIDE SCREEN" bottom-center, "GAME A" bottom-left of screen
- [ ] Game A/B buttons functional with aria-pressed
- [ ] Mute button shows correct icon state
- [ ] Responsive: device fills mobile, centers on desktop
- [ ] Focus rings visible on all interactive elements

**Dependencies**: T-2.1  
**FR/NFR**: FR13, FR15, NFR3

---

### T-3.1 — Audio: Sound Synthesis

**Files to create**:
```
lib/audio/synthesizer.ts
__tests__/synthesizer.test.ts
```

**Implementation**:
- `AudioSynthesizer` class
- `ensureContext()`: lazy AudioContext init, called from first user input
- `playCatch()`: 880Hz square wave, 80ms
- `playMiss()`: 120Hz sawtooth, 300ms, frequency ramp to 80Hz
- `playGameOver()`: four-note descending arpeggio over 1s

**Acceptance criteria**:
- [ ] AudioContext created lazily (not on module load)
- [ ] `playCatch()` creates and connects correct nodes without throwing
- [ ] `playMiss()` creates and connects correct nodes without throwing
- [ ] `playGameOver()` schedules notes correctly
- [ ] Muted state skips all synthesis
- [ ] Tests mock AudioContext, verify node creation

**Dependencies**: T-0.1  
**FR/NFR**: FR12

---

### T-3.2 — Audio: Input Integration & Mute

**Files to modify**: `lib/hooks/useInput.ts`, `components/DeviceFrame.tsx`

**Implementation**:
- First keydown/touchstart: call `synthesizer.ensureContext()`
- Catch event from engine: call `synthesizer.playCatch()`
- Miss event from engine: call `synthesizer.playMiss()`
- Game over event: call `synthesizer.playGameOver()`
- Mute toggle: `synthesizer.setMuted(!muted)`, persist in useState

**Acceptance criteria**:
- [ ] Sounds play on correct events (manual test)
- [ ] AudioContext initialized on first input, not before
- [ ] Mute toggle silences all sounds
- [ ] Mute state survives game restart (round-to-round persists)

**Dependencies**: T-3.1, T-1.5, T-1.7  
**FR/NFR**: FR12

---

### T-4.1 — Game Modes: Game A / B Speed

**Files to modify**: `lib/game/engine.ts`, `lib/game/constants.ts`

**Implementation**:
- Pass `mode` to all tick calculations
- Game B: fall rates × 1.3, helicopter traversal tick × 1.3, cooldown × 0.75
- Mode switch only allowed in 'attract' phase

**Acceptance criteria**:
- [ ] Game B parachutist reaches water ~30% faster than Game A
- [ ] Game B helicopter traversal is ~30% faster
- [ ] Mode change during play is ignored
- [ ] Tests: timing comparison A vs B for full parachutist fall

**Dependencies**: T-1.3  
**FR/NFR**: FR11

---

### T-4.2 — UX: Attract Screen

**Files to modify**: `components/GameCanvas.tsx`, `lib/game/engine.ts`

**Implementation**:
- 'attract' phase: run simplified loop (helicopter + 1 parachutist, no miss logic)
- PUSH START text flashes at 1Hz
- Score shows 000
- Any keydown/tap: if mode is set, transition to 'playing'

**Acceptance criteria**:
- [ ] Attract animation runs on page load
- [ ] PUSH START text flashes every 1s
- [ ] Pressing Enter/Space or tapping starts game
- [ ] Mode selection in attract phase doesn't restart if game is already in attract

**Dependencies**: T-2.4, T-2.5  
**FR/NFR**: FR11 (mode selector), Story 4.2

---

### T-4.3 — Mobile: Touch Input Polish

**Files to modify**: `lib/hooks/useInput.ts`, `components/GameCanvas.tsx`

**Implementation**:
- `touchstart` handler: prevent default to stop scroll
- Left half of canvas (x < canvas.width/2): moveBoat('left')
- Right half: moveBoat('right')
- Center tap (30–70% x range): start/pause
- Passive: false on event listener options for preventDefault to work

**Acceptance criteria**:
- [ ] No page scroll on swipe over game canvas
- [ ] Left/right tap moves boat correctly
- [ ] Touch targets are at least 44px in height (boat zone height)
- [ ] Tested manually on iOS Safari 16
- [ ] No double-tap zoom on mobile

**Dependencies**: T-1.4  
**FR/NFR**: FR14, FR15, NFR4

---

### T-INT-1 — Integration: Full Game Loop End-to-End

**Files to modify**: `__tests__/engine.test.ts`, potentially minor fixes across modules

**Scope**: Integration test that drives the full engine through a game A session: start → catch several parachutists → deliberately miss 3 → verify game over → restart → verify reset.

**Acceptance criteria**:
- [ ] Full session test passes in Vitest
- [ ] No unexpected state mutations between ticks
- [ ] Ghost list is empty at game over (no dangling ghosts)
- [ ] Score persists in-round then resets on restart

**Dependencies**: T-1.7, T-2.3, T-3.1  
**FR/NFR**: All FR1–FR15

---

### T-INT-2 — Integration: Visual Regression (manual)

**Scope**: Manual test session comparing the running web app to the original Game & Watch frames extracted from the reference video.

**Checklist**:
- [ ] Helicopter position matches frame 1 reference
- [ ] Parachutist zone sprites match frames 5, 10, 15
- [ ] Shark + MISS render matches frame 20, 22
- [ ] Multiple parachutists in-flight match frame 15
- [ ] Score display (0–6) matches across frames

**Dependencies**: T-INT-1  
**FR/NFR**: FR1, FR2, FR3, FR4, FR7, FR8

---

### T-5.1 — Vercel Deployment Configuration

**Files to create**:
```
vercel.json
.github/workflows/ci.yml
lighthouse-budget.json
```

**Acceptance criteria**:
- [ ] `vercel --prod` deploys successfully
- [ ] Production URL is accessible
- [ ] PR branches get preview URLs
- [ ] Security headers configured per architecture.md

**Dependencies**: T-0.1  
**FR/NFR**: NFR7

---

### T-5.2 — CI Pipeline: Lint, Test, Build, Lighthouse

**Files to modify**: `.github/workflows/ci.yml`

**Acceptance criteria**:
- [ ] `npm run type-check` runs in CI
- [ ] `npm run lint` runs in CI
- [ ] `npm run test` runs in CI (Vitest)
- [ ] `npm run build` runs in CI (next build)
- [ ] Lighthouse CI checks on preview URL:
  - Performance ≥ 90
  - Accessibility ≥ 85
  - Best Practices ≥ 90
- [ ] Failed checks block merge

**Dependencies**: T-5.1  
**FR/NFR**: NFR1, NFR3, NFR7

---

## Quality Gates

### Gate 1: Engine Complete (after T-1.7)
- [ ] All engine unit tests pass (0 failures)
- [ ] `npm run type-check` 0 errors
- [ ] Full game session integration test passes (T-INT-1 partial)

### Gate 2: Visual Fidelity Complete (after T-2.5, T-INT-2)
- [ ] Manual visual comparison to reference frames passes
- [ ] Ghost effect visually confirmed
- [ ] Device frame labels and proportions correct

### Gate 3: Full Feature Complete (after T-4.3, T-3.2)
- [ ] All 3 sounds play on correct events
- [ ] Touch input works on iOS Safari (manual test)
- [ ] Game A and B speed difference clearly perceptible
- [ ] No console errors in any browser

### Gate 4: Ship Ready (after T-5.2)
- [ ] Lighthouse CI all thresholds met
- [ ] Production Vercel URL accessible
- [ ] README tested (setup instructions work from clean clone)

---

## Dependency Graph

```
T-0.1
├── T-1.1
│   ├── T-1.2
│   │   └── T-1.3
│   │       ├── T-1.5
│   │       │   ├── T-1.6
│   │       │   │   └── T-1.7 ──────────────┐
│   │       │   └── T-3.2                   │
│   │       └── T-4.1                       │
│   └── T-1.4                               │
├── T-2.1                                   │
│   ├── T-2.2                               │
│   │   ├── T-2.3                           │
│   │   └── T-2.4                           │
│   └── T-2.5                               │
│       └── T-4.2                           │
├── T-3.1                                   │
│   └── T-3.2                               │
└── T-5.1                                   │
    └── T-5.2                               │
                                            ▼
                                    T-INT-1 → T-INT-2
```

---

## Summary

| Track | Tasks | Blocker |
|-------|-------|---------|
| A — Engine | T-1.1 → T-1.7 | None |
| B — Renderer | T-2.1 → T-2.4 | T-0.1 |
| C — React Shell | T-2.5, T-4.2, T-4.3 | T-2.1 |
| D — Audio | T-3.1, T-3.2 | T-0.1 |
| E — Integration | T-INT-1, T-INT-2 | All of A+B+C |
| F — Deploy | T-5.1, T-5.2 | T-0.1 (CI), T-INT-2 (Lighthouse) |

**Total tasks**: 22 + 2 integration = 24 tasks  
**Minimum path** (sequential): T-0.1 → T-1.1 → T-1.2 → T-1.3 → T-1.5 → T-1.7 → T-INT-1 → T-5.2 = 8 tasks  
**Realistic timeline**: 3 parallel engineers, 8 working days
