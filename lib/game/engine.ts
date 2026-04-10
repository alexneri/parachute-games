// lib/game/engine.ts
// Game engine — core state machine, physics, catch/miss logic
// Spec: docs/architecture.md, docs/stories/1.1–1.7, docs/atomized-implementation-plan.md

import { GameMode, GameState, Parachutist } from './types';
import {
  GAME_A_HELI_COOL_MS,
  GAME_B_HELI_COOL_MS,
  GAME_A_MAX_PARA,
  GAME_B_MAX_PARA,
  GAME_A_FALL_RATES,
  GAME_B_FALL_RATES,
  HELICOPTER_STEPS,
  DROP_STEP_INDICES,
  MAX_MISSES,
  MAX_SCORE,
  MISS_FLASH_MS,
  SHARK_VISIBLE_MS,
} from './constants';

let _idCounter = 0;

function makeInitialState(mode: GameMode): GameState {
  return {
    phase: 'attract',
    mode,
    score: 0,
    misses: 0,
    boat: { position: 2 },
    helicopter: {
      stepIndex: HELICOPTER_STEPS,
      totalSteps: HELICOPTER_STEPS,
      cooldownMs: 0,
      hasDroppedAt: new Set<number>(),
      isTraversing: true,
    },
    parachutists: [],
    shark: {
      visible: false,
      xPosition: 0,
      durationMs: 0,
    },
    missFlashMs: 0,
    soundEnabled: true,
    lastTickMs: 0,
  };
}

export class GameEngine {
  private state: GameState;

  constructor(mode: GameMode = 'A') {
    this.state = makeInitialState(mode);
  }

  getState(): GameState {
    return this.state;
  }

  /**
   * Advance physics by one fixed timestep.
   * Called by the game loop accumulator at the mode's fixed tick rate.
   */
  tick(deltaMs: number): GameState {
    const phase = this.state.phase;

    // Frozen phases — no-op
    if (phase === 'game_over' || phase === 'paused') {
      return this.state;
    }

    // Process existing timers first (so new events set this tick aren't decremented)
    this.updateTimers(deltaMs);

    this.updateHelicopter(deltaMs);
    this.updateParachutists(deltaMs);

    // Catch/miss only when actively playing
    if (phase === 'playing' || phase === 'miss_flash') {
      this.checkCatch();
    }

    // In attract: silently recycle parachutists that reach water
    if (phase === 'attract') {
      this.state.parachutists = this.state.parachutists.filter(
        (p) => p.state === 'falling',
      );
    }

    return this.state;
  }

  moveBoat(direction: 'left' | 'right'): void {
    const phase = this.state.phase;
    if (phase !== 'playing' && phase !== 'miss_flash') return;
    const pos = this.state.boat.position;
    this.state.boat.position =
      direction === 'left' ? Math.max(0, pos - 1) : Math.min(4, pos + 1);
  }

  setMode(mode: GameMode): void {
    if (this.state.phase !== 'attract') return;
    this.state.mode = mode;
  }

  /**
   * Called when the player presses Start/Enter.
   * attract → playing; paused → playing; playing → paused; game_over → no-op (use restart).
   */
  startGame(): void {
    const { phase } = this.state;
    if (phase === 'attract') {
      this.state.phase = 'playing';
    } else if (phase === 'paused') {
      this.state.phase = 'playing';
    } else if (phase === 'playing') {
      this.state.phase = 'paused';
    }
    // game_over: use restart()
  }

  restart(): void {
    const mode = this.state.mode;
    this.state = makeInitialState(mode);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private updateHelicopter(deltaMs: number): void {
    const s = this.state;
    const heli = s.helicopter;
    const maxPara = s.mode === 'A' ? GAME_A_MAX_PARA : GAME_B_MAX_PARA;
    const cooldownFull = s.mode === 'A' ? GAME_A_HELI_COOL_MS : GAME_B_HELI_COOL_MS;

    if (heli.isTraversing) {
      heli.stepIndex--;

      // Check drop positions (after decrement so drops happen as heli passes over)
      for (const dropStep of DROP_STEP_INDICES) {
        if (heli.stepIndex === dropStep && !heli.hasDroppedAt.has(dropStep)) {
          const activeFalling = s.parachutists.filter((p) => p.state === 'falling').length;
          if (activeFalling < maxPara) {
            this.spawnParachutist();
          }
          heli.hasDroppedAt.add(dropStep);
        }
      }

      // Reached left edge — start cooldown
      if (heli.stepIndex <= 0) {
        heli.isTraversing = false;
        heli.cooldownMs = cooldownFull;
      }
    } else {
      // Counting down before next traversal
      heli.cooldownMs -= deltaMs;
      if (heli.cooldownMs <= 0) {
        // Reset — helicopter appears at right edge; first step happens next tick
        heli.isTraversing = true;
        heli.stepIndex = HELICOPTER_STEPS;
        heli.hasDroppedAt = new Set<number>();
      }
      // Always return here: cooldown tick doesn't advance position
      return;
    }
  }

  private updateParachutists(_deltaMs: number): void {
    const s = this.state;
    const fallRates = s.mode === 'A' ? GAME_A_FALL_RATES : GAME_B_FALL_RATES;
    const inAttract = s.phase === 'attract';

    for (const para of s.parachutists) {
      if (para.state !== 'falling') continue;

      para.subZoneProgress += fallRates[para.zone];

      // Transition zones 0 → 1 → 2
      while (para.zone < 2 && para.subZoneProgress >= 1.0) {
        para.subZoneProgress -= 1.0;
        para.zone = (para.zone + 1) as 0 | 1 | 2;
      }

      // In attract mode: silently remove when parachutist hits water
      if (inAttract && para.zone === 2 && para.subZoneProgress >= 0.85) {
        para.state = 'missed';
      }
    }
  }

  private checkCatch(): void {
    const s = this.state;

    for (const para of s.parachutists) {
      if (para.state !== 'falling') continue;
      if (para.zone !== 2 || para.subZoneProgress < 0.85) continue;

      if (para.xPosition === s.boat.position) {
        // ── CATCH ──
        para.state = 'caught';
        s.score = Math.min(s.score + 1, MAX_SCORE);
      } else {
        // ── MISS ──
        para.state = 'missed';
        s.misses = Math.min(s.misses + 1, MAX_MISSES);
        s.missFlashMs = MISS_FLASH_MS;
        s.shark.visible = true;
        s.shark.xPosition = para.xPosition;
        s.shark.durationMs = SHARK_VISIBLE_MS;

        if (s.misses >= MAX_MISSES) {
          s.phase = 'game_over';
        } else if (s.phase !== 'miss_flash') {
          s.phase = 'miss_flash';
        }
      }
    }

    // Remove resolved parachutists immediately
    s.parachutists = s.parachutists.filter((p) => p.state === 'falling');
  }

  private updateTimers(deltaMs: number): void {
    const s = this.state;

    // Miss-flash timer
    if (s.missFlashMs > 0) {
      s.missFlashMs = Math.max(0, s.missFlashMs - deltaMs);
      if (s.missFlashMs === 0 && s.phase === 'miss_flash') {
        s.phase = 'playing';
      }
    }

    // Shark visibility timer
    if (s.shark.visible) {
      s.shark.durationMs = Math.max(0, s.shark.durationMs - deltaMs);
      if (s.shark.durationMs === 0) {
        s.shark.visible = false;
      }
    }
  }

  private spawnParachutist(): void {
    const s = this.state;
    const occupied = new Set(
      s.parachutists.filter((p) => p.state === 'falling').map((p) => p.xPosition),
    );
    const available = ([0, 1, 2, 3, 4] as const).filter((c) => !occupied.has(c));
    if (available.length === 0) return;

    const xPosition = available[Math.floor(Math.random() * available.length)];
    s.parachutists.push({
      id: String(++_idCounter),
      xPosition,
      zone: 0,
      subZoneProgress: 0,
      state: 'falling',
    } satisfies Parachutist);
  }
}
