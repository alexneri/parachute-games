# Documentation Index: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09

---

## Core Planning

| Document | Purpose | BMAD Agent |
|----------|---------|-----------|
| [idea.md](../idea.md) | Seed idea, one-liner, problem, audience | — |
| [brief.md](brief.md) | Problem deep-dive, personas, competitive landscape | analyst |
| [prd.md](prd.md) | Functional requirements (FR1–FR15), NFRs, epics, user stories | pm |
| [architecture.md](architecture.md) | System design, tech stack, data models, module architecture | architect |
| [front-end-spec.md](front-end-spec.md) | Design tokens, screen specs, components, accessibility | ux-expert |
| [atomized-implementation-plan.md](atomized-implementation-plan.md) | 24 agent-executable tasks, dependency graph, quality gates | po / analyst |

## Design Artifacts

| Document | Purpose |
|----------|---------|
| [brand-identity-parachute-game-2026-04-09.md](brand-identity-parachute-game-2026-04-09.md) | Brand archetype, voice, palette, typography |
| [design-trends-retro-gaming-2026-04-09.md](design-trends-retro-gaming-2026-04-09.md) | 5 macro trends, competitive matrix, adoption roadmap |
| [design-system-parachute-game-2026-04-09.md](design-system-parachute-game-2026-04-09.md) | Design tokens, component specs, 7-segment display spec |
| [ui-ux-parachute-game-2026-04-09.md](ui-ux-parachute-game-2026-04-09.md) | 6 screen specs, micro-interactions, responsive behavior |

## User Stories

| Story | Epic | Title |
|-------|------|-------|
| [1.1.game-loop-infrastructure.md](stories/1.1.game-loop-infrastructure.md) | 1 — Core Engine | Game Loop Infrastructure |
| [1.2.helicopter-entity.md](stories/1.2.helicopter-entity.md) | 1 | Helicopter Entity |
| [1.3.parachutist-entity.md](stories/1.3.parachutist-entity.md) | 1 | Parachutist Entity |
| [1.4.boat-player-entity.md](stories/1.4.boat-player-entity.md) | 1 | Boat Player Entity |
| [1.5.catch-miss-logic.md](stories/1.5.catch-miss-logic.md) | 1 | Catch & Miss Logic |
| [1.6.score-system.md](stories/1.6.score-system.md) | 1 | Score System |
| [1.7.game-over-restart.md](stories/1.7.game-over-restart.md) | 1 | Game Over & Restart |
| [2.1.canvas-rendering-foundation.md](stories/2.1.canvas-rendering-foundation.md) | 2 — LCD Presentation | Canvas Rendering Foundation |
| [2.2.sprite-system.md](stories/2.2.sprite-system.md) | 2 | Sprite System |
| [2.3.lcd-ghost-effect.md](stories/2.3.lcd-ghost-effect.md) | 2 | LCD Ghost Effect |
| [2.4.score-overlay-rendering.md](stories/2.4.score-overlay-rendering.md) | 2 | Score & Overlay Rendering |
| [2.5.device-frame.md](stories/2.5.device-frame.md) | 2 | Device Frame |
| [3.1.sound-effects.md](stories/3.1.sound-effects.md) | 3 — Audio | Sound Effects |
| [3.2.audio-controls.md](stories/3.2.audio-controls.md) | 3 | Audio Controls |
| [4.1.game-modes.md](stories/4.1.game-modes.md) | 4 — Polish | Game A / B Modes |
| [4.2.attract-screen.md](stories/4.2.attract-screen.md) | 4 | Attract Screen |
| [4.3.mobile-touch-polish.md](stories/4.3.mobile-touch-polish.md) | 4 | Mobile & Touch Polish |
| [5.1.vercel-deployment.md](stories/5.1.vercel-deployment.md) | 5 — Deploy | Vercel Deployment |
| [5.2.ci-pipeline.md](stories/5.2.ci-pipeline.md) | 5 | CI Pipeline |

---

## FR → Story Traceability

| FR | Covered by |
|----|-----------|
| FR1 — Game Board Rendering | 2.1, 2.2 |
| FR2 — LCD Ghost Effect | 2.3 |
| FR3 — Helicopter Mechanics | 1.2 |
| FR4 — Parachutist Fall | 1.3 |
| FR5 — Boat Movement | 1.4 |
| FR6 — Catch Logic | 1.5, 1.6 |
| FR7 — Miss Logic | 1.5, 2.4 |
| FR8 — Score Display | 1.6, 2.4 |
| FR9 — Miss Counter | 1.5, 1.7 |
| FR10 — Game Over | 1.7, 2.4 |
| FR11 — Game A / B | 4.1, 4.2 |
| FR12 — Sound Effects | 3.1, 3.2 |
| FR13 — Device Frame | 2.5 |
| FR14 — Input Handling | 1.4, 4.3 |
| FR15 — Responsive Layout | 2.1, 2.5 |
