# Product Requirements Document: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09  
**Status**: Approved

---

## Product Goals

1. Deliver a 1:1 faithful browser recreation of Nintendo Game & Watch Parachute (1981)
2. Achieve zero-friction access: one URL, no install, plays on any device
3. Serve as a reference-quality digital preservation artifact
4. Be performant enough for mobile play on mid-range hardware

---

## Success Metrics

| KPI | Target |
|-----|--------|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 85 |
| Lighthouse Mobile Usability | ≥ 90 |
| Bundle size (JS + CSS) | < 200KB |
| Game loop accuracy | ±50ms of documented hardware |
| FR coverage in stories | 100% |

---

## Functional Requirements

### FR1 — Game Board Rendering
The game must render on an HTML5 Canvas that visually reproduces the original LCD display. Background must use the correct pale sage-green tint (`#b8c9a3`). All sprites (helicopter, parachutists, boat, shark, water, palm trees, score) must render as hard black silhouettes at their documented discrete positions. The canvas must be responsive, scaling to fit the viewport while maintaining the original 4:3 aspect ratio.

**Acceptance Criteria**:
- Canvas renders with correct background color
- All 8 sprite categories are implemented and visible
- Canvas scales proportionally on viewport resize
- No sub-pixel aliasing on sprite edges

### FR2 — LCD Ghost / Persistence Effect
Previously active sprite positions must linger at 10–15% opacity for 80–120ms before fully clearing, simulating real LCD crystal response time.

**Acceptance Criteria**:
- Sprite positions fade rather than snap off
- Ghost opacity is between 0.10 and 0.15
- Ghost duration is 80–120ms
- Effect is visible on catch, miss, and position changes

### FR3 — Helicopter Mechanics
A helicopter spawns at the right edge of the screen and traverses left at a defined speed. It drops parachutists at up to two positions in its travel path. After reaching the left edge, it disappears and re-enters from the right after a cooldown interval. In Game A, traverse time is approximately 4s. In Game B, approximately 2.5s.

**Acceptance Criteria**:
- Helicopter renders at correct Y position (top-right quadrant)
- Helicopter moves left in discrete steps
- Drops parachutists at documented X positions
- Respawn cooldown is correct per mode
- Multiple parachutists can be in-flight simultaneously

### FR4 — Parachutist Fall Mechanics
Parachutists fall through three vertical zones at a defined rate. Zone 1: upper air (parachute open, slow fall). Zone 2: mid air (parachute open). Zone 3: water level (parachute closes, fast approach). Parachutist X position is fixed from spawn to catch/miss. Up to three parachutists can be in-flight simultaneously in Game B.

**Acceptance Criteria**:
- Parachutist renders in correct zone sprite per zone
- Fall speed is per-zone (slower in zones 1–2, faster in zone 3)
- X position is locked at spawn
- Maximum simultaneous parachutists: 2 (Game A), 3 (Game B)

### FR5 — Boat (Player) Movement
The player controls a rowboat that moves horizontally in the water zone. The boat has five discrete X positions. Movement is one position per keypress/tap. The boat cannot move beyond position 1 (leftmost) or position 5 (rightmost).

**Acceptance Criteria**:
- Boat renders at one of 5 discrete X positions
- Left key/tap moves boat one position left
- Right key/tap moves boat one position right
- Boat cannot move off-screen
- Movement is instant (no animation tween needed, per original)

### FR6 — Catch Logic
When a parachutist reaches Zone 3 (water level) and the boat's X position matches the parachutist's X position within the catch window, a catch event fires.

**Acceptance Criteria**:
- Catch fires when parachutist Y overlaps water zone AND boat X matches
- Catch increments score by 1
- Catch plays catch sound
- Caught parachutist disappears immediately
- No ghost effect on caught parachutist position (original behavior)

### FR7 — Miss Logic
When a parachutist reaches Zone 3 and no catch occurs within one game tick, a miss event fires.

**Acceptance Criteria**:
- Miss fires when parachutist hits water with no matching boat
- Miss increments miss counter by 1
- MISS text renders in bottom-right area for 1.5s
- Shark sprite renders briefly at miss position
- Miss plays miss buzz sound
- At 3 misses, GAME OVER sequence triggers

### FR8 — Score Display
Score renders as a 7-segment LCD-style number in the upper-center of the game screen. Score is 0–999. Score increments by 1 per catch. Score resets to 0 on new game.

**Acceptance Criteria**:
- Score renders in 7-segment font style (not system font)
- Score increments on every catch
- Maximum displayable score: 999 (wraps to 000 if exceeded)
- Score position: upper center of canvas

### FR9 — Miss Counter (Lives)
The game tracks misses. Three misses trigger GAME OVER. The miss count is shown visually (three dashes in the original hardware; we render as MISS flash count).

**Acceptance Criteria**:
- Miss counter tracks 0–3 internal misses
- Third miss triggers GAME OVER
- Miss counter resets on new game

### FR10 — Game Over Sequence
On third miss: game loop pauses, GAME OVER text renders on screen, game-over sound plays, final score is displayed, a restart prompt appears.

**Acceptance Criteria**:
- Game loop pauses on third miss
- GAME OVER text renders center-screen
- Game-over jingle plays (synthesized)
- Final score remains visible
- "Press Enter / Tap to restart" prompt appears
- New game resets score, miss counter, all entity positions

### FR11 — Game A / Game B Modes
Game A: standard speed, 2 max simultaneous parachutists. Game B: 30% faster fall and helicopter traversal, 3 max simultaneous parachutists, score accelerates at higher values. Mode selector appears on the device frame (matching original hardware button positions).

**Acceptance Criteria**:
- Game A and B modes are selectable before game start
- Game A timing matches documented hardware behavior
- Game B applies correct speed multiplier (1.3×)
- Active mode is visually indicated on the device frame

### FR12 — Sound Effects
Three synthesized sounds via Web Audio API: (1) catch blip — short 880Hz square wave, 80ms; (2) miss buzz — 120Hz sawtooth wave, 300ms with slight pitch decay; (3) game-over jingle — descending arpegio 880→440→220Hz, 1s total.

**Acceptance Criteria**:
- All three sounds play on correct events
- Sounds are synthesized (no audio file assets)
- Sounds respect browser autoplay policy (first interaction required)
- Master volume is controllable (mute toggle on device frame)

### FR13 — Device Frame
The canvas is presented inside a visual recreation of the Game & Watch hardware shell: cream/off-white plastic frame, rose-tinted inner screen bezel, "PARACHUTE" label top-center, "WIDE SCREEN" label bottom-center, "GAME A" label bottom-left of screen. Frame scales responsively with the canvas.

**Acceptance Criteria**:
- Device frame renders at all viewport sizes
- Frame preserves original proportions
- Labels are legible and correctly positioned
- Frame does not interfere with game input

### FR14 — Input Handling
Desktop: arrow keys (← →) and A/D keys. Touch: tap left half of screen for left, tap right half for right. Both: Enter/Space to start/pause, touch center area for start/pause on mobile.

**Acceptance Criteria**:
- Both keyboard and touch inputs work simultaneously
- No accidental scroll on mobile touch
- Touch targets are ≥ 44px (WCAG 2.2 AA)
- Input latency < 16ms (one frame)

### FR15 — Responsive Layout
Game scales from 320px (iPhone SE) to 1440px (desktop). Portrait orientation on mobile shows the device frame centered and full-width. Landscape on mobile shows the frame scaled to height. Desktop shows the frame centered with background context.

**Acceptance Criteria**:
- Game is playable at 320px viewport width
- No horizontal scroll at any viewport size
- Canvas maintains 4:3 aspect ratio at all sizes
- Font sizes scale proportionally with canvas

---

## Non-Functional Requirements

### NFR1 — Performance
Time to interactive must be < 1.5s on a 4G connection. The game loop must run at 60fps on mid-range mobile hardware (iPhone 12 class or equivalent Android). Canvas rendering must not drop below 30fps during peak entity count (3 parachutists + boat + helicopter + shark + effects).

### NFR2 — Bundle Size
Total JavaScript + CSS bundle must be < 200KB uncompressed. No large dependencies. Canvas rendering must not require WebGL or heavy 2D libraries — native Canvas 2D API only.

### NFR3 — Accessibility
Lighthouse Accessibility score ≥ 85. Game must have ARIA labels on all interactive controls. A screen reader must be able to navigate to and activate the start button. Keyboard navigation must work without a mouse. Color is not the sole differentiator for any game state.

### NFR4 — Browser Compatibility
Must work in: Chrome 120+, Firefox 120+, Safari 16+, Edge 120+. Must work on iOS Safari 16+ and Chrome for Android 120+. No IE support.

### NFR5 — Security
No server-side state. No user data collected. No cookies except optional local storage for high score (client-only). No third-party analytics scripts in initial release.

### NFR6 — Reliability
The game must handle tab-blur (requestAnimationFrame pauses automatically). On tab-return, the game resumes from pause. Window resize must not corrupt game state. Rapid key-mashing must not corrupt entity arrays.

### NFR7 — Deployment
Deployed to Vercel. Vercel preview deployments auto-generated on every PR. Production deployment on merge to main. Zero-downtime deploys.

---

## Epics

### Epic 1 — Core Game Engine (P0)
*Everything needed for a working, playable game.*

Build the game loop, entity system, physics (discrete position movement), input handling, and Canvas rendering. By end of this epic, the game is playable in a browser without device frame, sound, or styling — just the raw mechanics working correctly.

**Stories**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

### Epic 2 — LCD Presentation Layer (P0)
*Visual authenticity — the reason this project exists.*

Implement the LCD background, sprite rendering system, ghost/persistence effect, 7-segment score display, MISS text overlay, GAME OVER overlay, and the device frame. By end of this epic, the game looks like the original hardware.

**Stories**: 2.1, 2.2, 2.3, 2.4, 2.5

### Epic 3 — Audio (P1)
*Sound design via Web Audio API.*

Implement the three synthesized sound effects. Handle browser autoplay policy. Add mute toggle.

**Stories**: 3.1, 3.2

### Epic 4 — Game Modes & Polish (P1)
*Game A / Game B, score persistence, and UX polish.*

Implement mode selection, Game B speed multiplier, end-to-end game flow (attract screen → mode select → gameplay → game over → restart), responsive layout hardening, and mobile touch refinement.

**Stories**: 4.1, 4.2, 4.3

### Epic 5 — Deployment & Quality (P1)
*Ship it.*

Vercel deployment configuration, CI pipeline (lint + test + build), Lighthouse CI thresholds, and README.

**Stories**: 5.1, 5.2

---

## User Stories

### Epic 1 — Core Game Engine

**Story 1.1 — Game Loop Infrastructure**  
As a developer, I want a 60fps requestAnimationFrame game loop with fixed-timestep physics updates so that game logic is deterministic and rendering is smooth.  
*AC*: Loop runs at 60fps; physics updates at 30Hz fixed timestep; loop pauses when tab is hidden.

**Story 1.2 — Helicopter Entity**  
As a player, I want to see a helicopter traverse from right to left and drop parachutists so that gameplay can begin.  
*AC*: Helicopter spawns at right; moves in discrete steps; drops parachutists at correct X zones; respawns after cooldown.

**Story 1.3 — Parachutist Entity**  
As a player, I want parachutists to fall at realistic speeds through three zones so that I have time to position my boat.  
*AC*: Parachutist renders per-zone sprite; falls at zone-correct speed; X position locked; max simultaneous count enforced per mode.

**Story 1.4 — Boat Player Entity**  
As a player, I want to move my boat left and right to catch falling parachutists so that I can play the game.  
*AC*: Boat has 5 positions; moves one step per input; cannot exceed bounds.

**Story 1.5 — Catch & Miss Logic**  
As a player, I want the game to detect when I catch or miss a parachutist so that score and miss counter update correctly.  
*AC*: Catch fires on X overlap in Zone 3; miss fires on water-level exit; both update respective counters.

**Story 1.6 — Score System**  
As a player, I want my score to increment on each catch so that I have a goal to pursue.  
*AC*: Score increments by 1 per catch; max 999; resets on new game.

**Story 1.7 — Game Over & Restart**  
As a player, I want the game to end on three misses and allow me to restart so that I can try again.  
*AC*: Third miss pauses loop; GAME OVER state renders; restart resets all state.

### Epic 2 — LCD Presentation Layer

**Story 2.1 — Canvas Rendering Foundation**  
As a developer, I want a Canvas 2D rendering system with the correct LCD background and sprite pipeline so that all game entities can be drawn faithfully.  
*AC*: Canvas renders correct background color; sprite draw calls work; canvas scales responsively.

**Story 2.2 — Sprite System**  
As a player, I want all game sprites to look like the original Game & Watch silhouettes so that the game feels authentic.  
*AC*: All 8 sprite categories rendered as correct black silhouettes; positions match documented hardware layout.

**Story 2.3 — LCD Ghost Effect**  
As a player, I want previous sprite positions to linger at low opacity so that the game looks like real LCD hardware.  
*AC*: Ghost opacity 10–15%; ghost duration 80–120ms; visible on all sprite transitions.

**Story 2.4 — Score & Overlay Rendering**  
As a player, I want the score to display in a 7-segment LCD style and overlays (MISS, GAME OVER) to render correctly so that game state is always readable.  
*AC*: 7-segment font renders score 0–999; MISS text renders on miss events; GAME OVER renders on third miss.

**Story 2.5 — Device Frame**  
As a player, I want to see the game inside a rendered recreation of the Game & Watch hardware shell so that the experience is fully immersive.  
*AC*: Cream frame renders around canvas; rose bezel visible; PARACHUTE / WIDE SCREEN / GAME A labels present; frame scales with viewport.

### Epic 3 — Audio

**Story 3.1 — Sound Effects**  
As a player, I want to hear synthesized catch, miss, and game-over sounds so that the game has the right feel.  
*AC*: Three distinct sounds synthesized via Web Audio API; each plays on correct event; sounds match described characteristics.

**Story 3.2 — Audio Controls**  
As a player, I want to mute/unmute the game so that I can play silently in public.  
*AC*: Mute toggle on device frame; persists across rounds; respects browser autoplay policy.

### Epic 4 — Game Modes & Polish

**Story 4.1 — Game A / Game B Modes**  
As a player, I want to choose between Game A and Game B so that I can play at the difficulty that suits me.  
*AC*: Mode selector on device frame; Game B applies 1.3× speed; active mode shown.

**Story 4.2 — Attract Screen**  
As a player, I want to see an attract screen with the game idle-animating so that the game invites me to play.  
*AC*: Attract mode shows helicopter and one parachutist looping; score shows 0; press any key to start.

**Story 4.3 — Mobile & Touch Polish**  
As a mobile player, I want reliable touch input without accidental scrolling so that the game plays well on phone.  
*AC*: touchstart handled; default scroll prevented; visual touch target areas visible; tested on iOS Safari.

### Epic 5 — Deployment & Quality

**Story 5.1 — Vercel Deployment**  
As a developer, I want the game deployed to Vercel with preview deployments on PRs so that every change is testable before merge.  
*AC*: vercel.json configured; main branch deploys to production; PR branches get preview URLs.

**Story 5.2 — CI Pipeline**  
As a developer, I want lint, type-check, unit tests, and build checks on every PR so that regressions are caught automatically.  
*AC*: GitHub Actions workflow runs tsc, eslint, vitest, next build; Lighthouse CI checks performance ≥ 90.

---

## Launch Timeline

| Milestone | Target | Criteria |
|-----------|--------|----------|
| M0 — Project setup | Day 1 | Repo, Next.js scaffold, Vercel linked |
| M1 — Playable prototype | Day 3 | Epic 1 complete; game playable without styling |
| M2 — Visual fidelity | Day 5 | Epic 2 complete; looks like the original |
| M3 — Audio & modes | Day 7 | Epics 3 + 4 complete; full experience |
| M4 — Ship | Day 8 | Epic 5 complete; production URL live |
