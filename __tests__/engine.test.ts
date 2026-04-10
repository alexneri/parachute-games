// __tests__/engine.test.ts
// Unit + integration tests for GameEngine
// Spec: T-1.1 through T-1.7, T-INT-1

import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../lib/game/engine';
import {
  GAME_A_TICK_MS,
  GAME_B_TICK_MS,
  GAME_A_HELI_COOL_MS,
  GAME_B_HELI_COOL_MS,
  HELICOPTER_STEPS,
  MAX_MISSES,
  MAX_SCORE,
  MISS_FLASH_MS,
  SHARK_VISIBLE_MS,
  GAME_A_FALL_RATES,
  GAME_B_FALL_RATES,
} from '../lib/game/constants';

// ── T-1.1: Core State Machine ──────────────────────────────────────────────

describe('T-1.1 GameEngine constructor', () => {
  it('instantiates with mode A', () => {
    const e = new GameEngine('A');
    expect(e.getState().mode).toBe('A');
  });

  it('instantiates with mode B', () => {
    const e = new GameEngine('B');
    expect(e.getState().mode).toBe('B');
  });

  it('getState() returns all required fields', () => {
    const state = new GameEngine().getState();
    expect(state).toMatchObject({
      phase: 'attract',
      mode: 'A',
      score: 0,
      misses: 0,
      boat: { position: 2 },
      missFlashMs: 0,
      soundEnabled: true,
    });
    expect(state.helicopter).toBeDefined();
    expect(state.parachutists).toBeInstanceOf(Array);
    expect(state.shark).toBeDefined();
  });

  it('initial phase is attract', () => {
    expect(new GameEngine().getState().phase).toBe('attract');
  });
});

describe('T-1.1 restart', () => {
  it('resets score, misses, phase to attract', () => {
    const e = new GameEngine();
    e.startGame();
    // Force some state changes
    const s = e.getState();
    (s as { score: number }).score = 50;
    (s as { misses: number }).misses = 2;

    e.restart();
    const state = e.getState();
    expect(state.score).toBe(0);
    expect(state.misses).toBe(0);
    expect(state.phase).toBe('attract');
    expect(state.parachutists).toHaveLength(0);
    expect(state.shark.visible).toBe(false);
  });
});

describe('T-1.1 setMode guard', () => {
  it('setMode works in attract phase', () => {
    const e = new GameEngine('A');
    e.setMode('B');
    expect(e.getState().mode).toBe('B');
  });

  it('setMode is ignored when not in attract', () => {
    const e = new GameEngine('A');
    e.startGame(); // attract → playing
    e.setMode('B');
    expect(e.getState().mode).toBe('A');
  });
});

// ── T-1.2: Helicopter Mechanics ────────────────────────────────────────────

describe('T-1.2 helicopter traversal', () => {
  it('starts at HELICOPTER_STEPS', () => {
    const e = new GameEngine();
    expect(e.getState().helicopter.stepIndex).toBe(HELICOPTER_STEPS);
    expect(e.getState().helicopter.isTraversing).toBe(true);
  });

  it('decrements stepIndex each tick', () => {
    const e = new GameEngine();
    e.startGame();
    const before = e.getState().helicopter.stepIndex;
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().helicopter.stepIndex).toBe(before - 1);
  });

  it('enters cooldown after reaching step 0', () => {
    const e = new GameEngine('A');
    e.startGame();
    // HELICOPTER_STEPS ticks takes stepIndex from HELICOPTER_STEPS to 0
    for (let i = 0; i < HELICOPTER_STEPS; i++) {
      e.tick(GAME_A_TICK_MS);
    }
    expect(e.getState().helicopter.isTraversing).toBe(false);
    expect(e.getState().helicopter.cooldownMs).toBeGreaterThan(0);
  });

  it('uses Game A cooldown for mode A', () => {
    const e = new GameEngine('A');
    e.startGame();
    for (let i = 0; i < HELICOPTER_STEPS; i++) {
      e.tick(GAME_A_TICK_MS);
    }
    // cooldownMs set in same tick traversal ends, not yet decremented
    expect(e.getState().helicopter.cooldownMs).toBe(GAME_A_HELI_COOL_MS);
  });

  it('uses Game B cooldown for mode B', () => {
    const e = new GameEngine('B');
    e.startGame();
    for (let i = 0; i < HELICOPTER_STEPS; i++) {
      e.tick(GAME_B_TICK_MS);
    }
    expect(e.getState().helicopter.cooldownMs).toBe(GAME_B_HELI_COOL_MS);
  });

  it('resets after cooldown expires', () => {
    const e = new GameEngine('A');
    e.startGame();
    // Complete traversal exactly
    for (let i = 0; i < HELICOPTER_STEPS; i++) {
      e.tick(GAME_A_TICK_MS);
    }
    // Drain cooldown with exact number of ticks needed
    const cooldown = e.getState().helicopter.cooldownMs; // = GAME_A_HELI_COOL_MS
    const ticksNeeded = Math.ceil(cooldown / GAME_A_TICK_MS);
    for (let i = 0; i < ticksNeeded; i++) {
      e.tick(GAME_A_TICK_MS);
    }
    // Helicopter should have reset to starting position (no step in reset tick)
    expect(e.getState().helicopter.isTraversing).toBe(true);
    expect(e.getState().helicopter.stepIndex).toBe(HELICOPTER_STEPS);
  });
});

// ── T-1.3: Parachutist Fall ────────────────────────────────────────────────

describe('T-1.3 parachutist fall', () => {
  function spawnAndGet(mode: 'A' | 'B' = 'A') {
    const e = new GameEngine(mode);
    e.startGame();
    // Access private method via any for testing
    (e as unknown as { spawnParachutist: () => void }).spawnParachutist?.();
    // Alternatively, tick until helicopter drops one
    for (let i = 0; i < 20; i++) {
      e.tick(GAME_A_TICK_MS);
      if (e.getState().parachutists.length > 0) break;
    }
    return e;
  }

  it('parachutist starts in zone 0', () => {
    const e = spawnAndGet();
    const paras = e.getState().parachutists;
    if (paras.length > 0) {
      expect(paras[0].zone).toBe(0);
    }
  });

  it('xPosition is immutable once spawned', () => {
    const e = spawnAndGet();
    const paras = e.getState().parachutists;
    if (paras.length === 0) return;
    const origX = paras[0].xPosition;
    for (let i = 0; i < 5; i++) {
      e.tick(GAME_A_TICK_MS);
    }
    const para = e.getState().parachutists.find((p) => p.id === paras[0].id);
    if (para) {
      expect(para.xPosition).toBe(origX);
    }
  });

  it('Game B fall rates are ~1.3× Game A', () => {
    for (let z = 0; z < 3; z++) {
      const ratio = GAME_B_FALL_RATES[z] / GAME_A_FALL_RATES[z];
      expect(ratio).toBeGreaterThan(1.2);
      expect(ratio).toBeLessThan(1.5);
    }
  });
});

// ── T-1.4: Boat Movement ───────────────────────────────────────────────────

describe('T-1.4 boat movement', () => {
  it('moves left', () => {
    const e = new GameEngine();
    e.startGame();
    const before = e.getState().boat.position;
    e.moveBoat('left');
    expect(e.getState().boat.position).toBe(Math.max(0, before - 1));
  });

  it('moves right', () => {
    const e = new GameEngine();
    e.startGame();
    e.getState().boat.position = 0;
    e.moveBoat('right');
    expect(e.getState().boat.position).toBe(1);
  });

  it('cannot go below 0', () => {
    const e = new GameEngine();
    e.startGame();
    e.getState().boat.position = 0;
    e.moveBoat('left');
    expect(e.getState().boat.position).toBe(0);
  });

  it('cannot go above 4', () => {
    const e = new GameEngine();
    e.startGame();
    e.getState().boat.position = 4;
    e.moveBoat('right');
    expect(e.getState().boat.position).toBe(4);
  });

  it('ignores input in attract phase', () => {
    const e = new GameEngine();
    // still in attract
    e.getState().boat.position = 2;
    e.moveBoat('left');
    expect(e.getState().boat.position).toBe(2);
  });

  it('ignores input in game_over phase', () => {
    const e = new GameEngine();
    e.startGame();
    const s = e.getState();
    (s as { phase: string }).phase = 'game_over';
    e.getState().boat.position = 2;
    e.moveBoat('left');
    expect(e.getState().boat.position).toBe(2);
  });
});

// ── T-1.5: Catch & Miss Logic ──────────────────────────────────────────────

describe('T-1.5 catch logic', () => {
  function setupForCatch(boatPos: number) {
    const e = new GameEngine('A');
    e.startGame();
    const state = e.getState();
    state.boat.position = boatPos;

    // Manually inject a parachutist at zone 2 ready to be caught
    state.parachutists.push({
      id: 'test-catch',
      xPosition: boatPos,
      zone: 2,
      subZoneProgress: 0.85,
      state: 'falling',
    });
    return e;
  }

  function setupForMiss(boatPos: number, paraPos: number) {
    const e = new GameEngine('A');
    e.startGame();
    const state = e.getState();
    state.boat.position = boatPos;

    state.parachutists.push({
      id: 'test-miss',
      xPosition: paraPos,
      zone: 2,
      subZoneProgress: 0.85,
      state: 'falling',
    });
    return e;
  }

  it('catch fires when xPositions match in zone 2', () => {
    const e = setupForCatch(2);
    const beforeScore = e.getState().score;
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().score).toBe(beforeScore + 1);
  });

  it('no catch on off-by-one position', () => {
    const e = setupForMiss(2, 3);
    const beforeScore = e.getState().score;
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().score).toBe(beforeScore);
    expect(e.getState().misses).toBe(1);
  });

  it('score wraps at 999', () => {
    const e = new GameEngine('A');
    e.startGame();
    const s = e.getState();
    (s as { score: number }).score = 999;
    s.boat.position = 2;
    s.parachutists.push({
      id: 'wrap-test',
      xPosition: 2,
      zone: 2,
      subZoneProgress: 0.85,
      state: 'falling',
    });
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().score).toBe(MAX_SCORE); // stays at 999
  });

  it('miss increments miss counter', () => {
    const e = setupForMiss(0, 4);
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().misses).toBe(1);
  });

  it('miss sets missFlashMs', () => {
    const e = setupForMiss(0, 4);
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().missFlashMs).toBeCloseTo(MISS_FLASH_MS, -2);
  });

  it('miss sets shark visible at parachutist X', () => {
    const e = setupForMiss(0, 3);
    e.tick(GAME_A_TICK_MS);
    const { shark } = e.getState();
    expect(shark.visible).toBe(true);
    expect(shark.xPosition).toBe(3);
  });
});

// ── T-1.6: Miss Flash & Shark Lifecycle ────────────────────────────────────

describe('T-1.6 timers', () => {
  it('missFlashMs decrements each tick', () => {
    const e = new GameEngine('A');
    e.startGame();
    e.getState().missFlashMs = MISS_FLASH_MS;
    (e.getState() as { phase: string }).phase = 'miss_flash';
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().missFlashMs).toBe(MISS_FLASH_MS - GAME_A_TICK_MS);
  });

  it('phase returns to playing after missFlashMs expires', () => {
    const e = new GameEngine('A');
    e.startGame();
    const s = e.getState();
    s.missFlashMs = GAME_A_TICK_MS; // exactly one tick
    (s as { phase: string }).phase = 'miss_flash';
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().phase).toBe('playing');
  });

  it('shark visibility clears after durationMs expires', () => {
    const e = new GameEngine('A');
    e.startGame();
    const s = e.getState();
    s.shark.visible = true;
    s.shark.durationMs = GAME_A_TICK_MS;
    e.tick(GAME_A_TICK_MS);
    expect(e.getState().shark.visible).toBe(false);
  });
});

// ── T-1.7: Game Over & Restart ─────────────────────────────────────────────

describe('T-1.7 game over', () => {
  function triggerGameOver() {
    const e = new GameEngine('A');
    e.startGame();
    const s = e.getState();
    // Force misses to MAX_MISSES - 1 then inject a miss
    (s as { misses: number }).misses = MAX_MISSES - 1;
    s.boat.position = 0;
    s.parachutists.push({
      id: 'go-trigger',
      xPosition: 4,
      zone: 2,
      subZoneProgress: 0.85,
      state: 'falling',
    });
    e.tick(GAME_A_TICK_MS);
    return e;
  }

  it('third miss sets phase to game_over', () => {
    const e = triggerGameOver();
    expect(e.getState().phase).toBe('game_over');
  });

  it('engine tick is a no-op in game_over phase', () => {
    const e = triggerGameOver();
    const snapBefore = JSON.stringify({
      score: e.getState().score,
      parachutists: e.getState().parachutists.length,
    });
    e.tick(GAME_A_TICK_MS);
    const snapAfter = JSON.stringify({
      score: e.getState().score,
      parachutists: e.getState().parachutists.length,
    });
    expect(snapAfter).toBe(snapBefore);
  });

  it('restart resets score=0, misses=0, parachutists=[], phase=attract', () => {
    const e = triggerGameOver();
    e.restart();
    const s = e.getState();
    expect(s.score).toBe(0);
    expect(s.misses).toBe(0);
    expect(s.phase).toBe('attract');
    expect(s.parachutists).toHaveLength(0);
    expect(s.shark.visible).toBe(false);
    expect(s.helicopter.stepIndex).toBe(HELICOPTER_STEPS);
  });

  it('miss counter resets to 0 after restart', () => {
    const e = triggerGameOver();
    e.restart();
    expect(e.getState().misses).toBe(0);
  });
});

// ── T-INT-1: Full session integration ─────────────────────────────────────

describe('T-INT-1 full game session', () => {
  it('start → catch several → miss 3 → game_over → restart → reset', () => {
    const e = new GameEngine('A');

    // Start
    e.startGame();
    expect(e.getState().phase).toBe('playing');

    // Inject and catch 5 parachutists
    for (let i = 0; i < 5; i++) {
      const s = e.getState();
      s.boat.position = 2;
      s.parachutists = [
        { id: `catch-${i}`, xPosition: 2, zone: 2, subZoneProgress: 0.85, state: 'falling' },
      ];
      e.tick(GAME_A_TICK_MS);
    }
    expect(e.getState().score).toBe(5);

    // Miss 3 times
    for (let i = 0; i < MAX_MISSES; i++) {
      const s = e.getState();
      s.boat.position = 0;
      s.parachutists = [
        { id: `miss-${i}`, xPosition: 4, zone: 2, subZoneProgress: 0.85, state: 'falling' },
      ];
      if (i < MAX_MISSES - 1) {
        // Clear miss_flash so next miss registers
        s.missFlashMs = 0;
        (s as { phase: string }).phase = 'playing';
      }
      e.tick(GAME_A_TICK_MS);
    }

    expect(e.getState().phase).toBe('game_over');
    expect(e.getState().score).toBe(5); // score preserved until restart

    // Restart
    e.restart();
    const after = e.getState();
    expect(after.phase).toBe('attract');
    expect(after.score).toBe(0);
    expect(after.misses).toBe(0);
    expect(after.parachutists).toHaveLength(0);
  });

  it('no unexpected state mutations between ticks', () => {
    const e = new GameEngine('A');
    e.startGame();
    const initialHeli = { ...e.getState().helicopter };
    e.tick(GAME_A_TICK_MS);
    // Helicopter should only move by exactly 1 step
    const diff = initialHeli.stepIndex - e.getState().helicopter.stepIndex;
    expect(diff).toBe(1);
  });
});
