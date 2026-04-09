// lib/game/types.ts
// All game type definitions — spec source: docs/architecture.md

export type GameMode = 'A' | 'B';
export type GamePhase = 'attract' | 'playing' | 'paused' | 'miss_flash' | 'game_over';

export interface Position {
  x: number; // 0–4 for boat (discrete), 0–N for helicopter (continuous step index)
  y: number; // Zone index for parachutists (0–2), or row index
}

export interface Parachutist {
  id: string;
  xPosition: number;          // Locked X column (0–4 matching boat columns)
  zone: 0 | 1 | 2;           // Current fall zone
  subZoneProgress: number;    // 0.0–1.0 within zone (for ghost effect precision)
  state: 'falling' | 'caught' | 'missed';
}

export interface Helicopter {
  stepIndex: number;           // Current step in traverse path (0 = rightmost)
  totalSteps: number;          // Total steps to cross screen
  cooldownMs: number;          // Time remaining before next traversal
  hasDroppedAt: Set<number>;   // Step indices where parachutist was dropped
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
  misses: number;             // 0–3
  boat: {
    position: number;         // 0–4
  };
  helicopter: Helicopter;
  parachutists: Parachutist[];
  shark: Shark;
  missFlashMs: number;        // Remaining ms for MISS text display
  soundEnabled: boolean;
  lastTickMs: number;         // Timestamp of last physics update
}

// ── Renderer types ─────────────────────────────────────────────────────────

export type SpriteKey =
  | 'helicopter'
  | 'parachutist_zone0'
  | 'parachutist_zone1'
  | 'parachutist_zone2'
  | 'boat'
  | 'boat_catching'
  | 'shark'
  | 'water_1'
  | 'water_2'
  | 'palm_left'
  | 'palm_right';

export interface SpriteGhost {
  spriteKey: SpriteKey;
  x: number;
  y: number;
  opacity: number;    // 0.12 initial, decays to 0
  spawnedAt: number;  // performance.now() timestamp
}

export interface RenderFrame {
  gameState: GameState;
  ghosts: SpriteGhost[];
  timestamp: number;
}
