// lib/game/constants.ts
// All numeric and string constants — spec source: docs/architecture.md

// ── Canvas ──────────────────────────────────────────────────────────────────
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 300;

// ── Colors ──────────────────────────────────────────────────────────────────
export const LCD_BG_COLOR = '#b8c9a3';
export const SPRITE_COLOR = '#1a1a1a';
export const LCD_SEGMENT_OFF = 'rgba(26, 26, 26, 0.05)';
export const GHOST_OPACITY = 0.12;
export const GAME_OVER_OVERLAY = 'rgba(0, 0, 0, 0.15)';

// ── Ghost effect ─────────────────────────────────────────────────────────────
export const GHOST_DURATION_MS = 100;

// ── Boat ─────────────────────────────────────────────────────────────────────
/** Pixel X coordinates for each of the 5 boat positions */
export const BOAT_POSITIONS: [number, number, number, number, number] = [48, 112, 176, 240, 304];
export const BOAT_Y = 240;

// ── Helicopter ────────────────────────────────────────────────────────────────
export const HELICOPTER_Y = 36;
export const HELICOPTER_SPAWN_X = 360;
export const HELICOPTER_STEP_PX = 24;
export const HELICOPTER_STEPS = 15;

/** Step indices at which a parachutist may be dropped */
export const DROP_STEP_INDICES: readonly number[] = [7, 3];

/** Pixel X columns for parachutist drop (mirror of BOAT_POSITIONS) */
export const DROP_X_COLUMNS: [number, number, number, number, number] = [48, 112, 176, 240, 304];

// ── Parachutist zones ─────────────────────────────────────────────────────────
/** Y pixel for top of each zone */
export const ZONE_Y: [number, number, number] = [80, 150, 215];

// ── Timing — Game A ───────────────────────────────────────────────────────────
export const GAME_A_TICK_MS = 500;
export const GAME_A_HELI_COOL_MS = 2000;
export const GAME_A_MAX_PARA = 2;
/** subZoneProgress increment per tick, indexed by zone 0/1/2 */
export const GAME_A_FALL_RATES: [number, number, number] = [0.25, 0.33, 0.5];

// ── Timing — Game B ───────────────────────────────────────────────────────────
export const GAME_B_TICK_MS = 385;
export const GAME_B_HELI_COOL_MS = 1200;
export const GAME_B_MAX_PARA = 3;
export const GAME_B_FALL_RATES: [number, number, number] = [0.33, 0.43, 0.65];

// ── Game rules ────────────────────────────────────────────────────────────────
export const MAX_MISSES = 3;
export const MAX_SCORE = 999;
export const MISS_FLASH_MS = 1500;
export const SHARK_VISIBLE_MS = 800;
export const CATCH_FRAME_MS = 100;

// ── Score display (7-segment) ─────────────────────────────────────────────────
/** X positions of the three score digits on the logical canvas */
export const SCORE_DIGIT_X: [number, number, number] = [172, 185, 198];
export const SCORE_Y = 8;

// ── Water animation ───────────────────────────────────────────────────────────
export const WATER_Y = 230;
export const WATER_ANIM_PERIOD_MS = 1000; // 1Hz cycle

// ── Palms ─────────────────────────────────────────────────────────────────────
export const PALM_LEFT_X = 0;
export const PALM_RIGHT_X = 356;
export const PALM_Y = 170;

// ── Shark ─────────────────────────────────────────────────────────────────────
export const SHARK_Y = 258;

// ── High score storage ────────────────────────────────────────────────────────
export const HS_KEY = 'parachute_highscore';

export const getHighScore = (): number =>
  parseInt(
    typeof localStorage !== 'undefined' ? (localStorage.getItem(HS_KEY) ?? '0') : '0',
    10,
  );

export const setHighScore = (score: number): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(HS_KEY, String(score));
  }
};
