// lib/game/sprites.ts
// Vector sprite draw functions — all sprites rendered as canvas 2D primitives
// Spec: docs/architecture.md, T-2.2 in docs/atomized-implementation-plan.md
//
// All coordinates are at logical 1× scale (400×300 canvas).
// (x, y) is the TOP-LEFT of the sprite's bounding box.
// SPRITE_COLOR (#1a1a1a) is set on ctx before calling any draw function.

import { SpriteKey } from './types';
import { SPRITE_COLOR } from './constants';

export type SpriteDraw = (
  _ctx: CanvasRenderingContext2D,
  _x: number,
  _y: number,
  _scale?: number,
) => void;

// ── Helpers ────────────────────────────────────────────────────────────────

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ── Sprite draw functions ──────────────────────────────────────────────────

/** Helicopter — 52×24 px bounding box */
const helicopter: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;

  // Rotor blade (top, full width)
  rect(ctx, x, y, 52 * s, 3 * s);

  // Rotor mast
  rect(ctx, x + 22 * s, y + 3 * s, 4 * s, 4 * s);

  // Body
  rect(ctx, x + 4 * s, y + 7 * s, 36 * s, 10 * s);

  // Tail boom (extending right)
  rect(ctx, x + 40 * s, y + 10 * s, 12 * s, 4 * s);

  // Tail fin
  rect(ctx, x + 48 * s, y + 7 * s, 4 * s, 7 * s);

  // Landing skid (left)
  rect(ctx, x + 4 * s, y + 17 * s, 20 * s, 3 * s);

  // Landing skid strut
  rect(ctx, x + 10 * s, y + 14 * s, 3 * s, 3 * s);
  rect(ctx, x + 22 * s, y + 14 * s, 3 * s, 3 * s);

  // Cockpit window
  ctx.fillStyle = '#b8c9a3';
  rect(ctx, x + 8 * s, y + 9 * s, 10 * s, 6 * s);
  ctx.fillStyle = SPRITE_COLOR;
};

/** Parachutist in zone 0 — 24×40 px — large open canopy */
const parachutist_zone0: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;

  // Canopy (filled arc)
  ctx.beginPath();
  ctx.arc(x + 12 * s, y + 14 * s, 14 * s, Math.PI, 0, false);
  ctx.fill();

  // Clear inside of canopy
  ctx.fillStyle = '#b8c9a3';
  ctx.beginPath();
  ctx.arc(x + 12 * s, y + 14 * s, 11 * s, Math.PI, 0, false);
  ctx.fill();
  ctx.fillStyle = SPRITE_COLOR;

  // Suspension lines (left and right)
  rect(ctx, x + 6 * s, y + 14 * s, 2 * s, 8 * s);
  rect(ctx, x + 16 * s, y + 14 * s, 2 * s, 8 * s);

  // Body
  rect(ctx, x + 9 * s, y + 22 * s, 6 * s, 8 * s);

  // Legs
  rect(ctx, x + 8 * s, y + 30 * s, 4 * s, 4 * s);
  rect(ctx, x + 12 * s, y + 30 * s, 4 * s, 4 * s);

  // Arms out
  rect(ctx, x + 3 * s, y + 22 * s, 6 * s, 3 * s);
  rect(ctx, x + 15 * s, y + 22 * s, 6 * s, 3 * s);
};

/** Parachutist in zone 1 — 22×36 px — smaller canopy */
const parachutist_zone1: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;

  // Canopy (slightly smaller)
  ctx.beginPath();
  ctx.arc(x + 11 * s, y + 11 * s, 12 * s, Math.PI, 0, false);
  ctx.fill();

  ctx.fillStyle = '#b8c9a3';
  ctx.beginPath();
  ctx.arc(x + 11 * s, y + 11 * s, 9 * s, Math.PI, 0, false);
  ctx.fill();
  ctx.fillStyle = SPRITE_COLOR;

  // Suspension lines
  rect(ctx, x + 5 * s, y + 11 * s, 2 * s, 7 * s);
  rect(ctx, x + 15 * s, y + 11 * s, 2 * s, 7 * s);

  // Body
  rect(ctx, x + 8 * s, y + 18 * s, 6 * s, 8 * s);

  // Legs
  rect(ctx, x + 7 * s, y + 26 * s, 3 * s, 4 * s);
  rect(ctx, x + 12 * s, y + 26 * s, 3 * s, 4 * s);

  // Arms
  rect(ctx, x + 3 * s, y + 18 * s, 5 * s, 3 * s);
  rect(ctx, x + 14 * s, y + 18 * s, 5 * s, 3 * s);
};

/** Parachutist in zone 2 — 16×22 px — no canopy, falling fast */
const parachutist_zone2: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;

  // Head
  rect(ctx, x + 5 * s, y, 6 * s, 6 * s);

  // Body
  rect(ctx, x + 4 * s, y + 6 * s, 8 * s, 8 * s);

  // Arms out (panic mode)
  rect(ctx, x, y + 6 * s, 4 * s, 3 * s);
  rect(ctx, x + 12 * s, y + 6 * s, 4 * s, 3 * s);

  // Legs spread
  rect(ctx, x + 2 * s, y + 14 * s, 4 * s, 8 * s);
  rect(ctx, x + 10 * s, y + 14 * s, 4 * s, 8 * s);
};

/** Boat — 48×20 px */
const boat: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;

  // Hull (trapezoidal)
  ctx.beginPath();
  ctx.moveTo(Math.round(x), Math.round(y + 4 * s));
  ctx.lineTo(Math.round(x + 4 * s), Math.round(y));
  ctx.lineTo(Math.round(x + 44 * s), Math.round(y));
  ctx.lineTo(Math.round(x + 48 * s), Math.round(y + 4 * s));
  ctx.lineTo(Math.round(x + 48 * s), Math.round(y + 14 * s));
  ctx.lineTo(Math.round(x + 8 * s), Math.round(y + 20 * s));
  ctx.lineTo(Math.round(x + 4 * s), Math.round(y + 20 * s));
  ctx.lineTo(Math.round(x), Math.round(y + 14 * s));
  ctx.closePath();
  ctx.fill();

  // Interior highlight (LCD color)
  ctx.fillStyle = '#b8c9a3';
  rect(ctx, x + 6 * s, y + 4 * s, 36 * s, 8 * s);
  ctx.fillStyle = SPRITE_COLOR;

  // Oars (extending left and right)
  rect(ctx, x - 4 * s, y + 8 * s, 8 * s, 3 * s);
  rect(ctx, x + 44 * s, y + 8 * s, 8 * s, 3 * s);

  // Person (seated)
  rect(ctx, x + 20 * s, y - 4 * s, 8 * s, 8 * s);
};

/** Boat catching — 48×24 px — arms raised */
const boat_catching: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;

  // Hull
  ctx.beginPath();
  ctx.moveTo(Math.round(x), Math.round(y + 8 * s));
  ctx.lineTo(Math.round(x + 4 * s), Math.round(y + 4 * s));
  ctx.lineTo(Math.round(x + 44 * s), Math.round(y + 4 * s));
  ctx.lineTo(Math.round(x + 48 * s), Math.round(y + 8 * s));
  ctx.lineTo(Math.round(x + 48 * s), Math.round(y + 18 * s));
  ctx.lineTo(Math.round(x + 8 * s), Math.round(y + 24 * s));
  ctx.lineTo(Math.round(x + 4 * s), Math.round(y + 24 * s));
  ctx.lineTo(Math.round(x), Math.round(y + 18 * s));
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#b8c9a3';
  rect(ctx, x + 6 * s, y + 8 * s, 36 * s, 8 * s);
  ctx.fillStyle = SPRITE_COLOR;

  // Oars
  rect(ctx, x - 4 * s, y + 12 * s, 8 * s, 3 * s);
  rect(ctx, x + 44 * s, y + 12 * s, 8 * s, 3 * s);

  // Person with arms up
  rect(ctx, x + 20 * s, y - 4 * s, 8 * s, 8 * s);   // head/body
  rect(ctx, x + 14 * s, y - 8 * s, 6 * s, 4 * s);   // left arm raised
  rect(ctx, x + 28 * s, y - 8 * s, 6 * s, 4 * s);   // right arm raised
};

/** Shark — 18×14 px */
const shark: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(Math.round(x + 8 * s), Math.round(y));
  ctx.lineTo(Math.round(x + 14 * s), Math.round(y + 7 * s));
  ctx.lineTo(Math.round(x + 4 * s), Math.round(y + 7 * s));
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(Math.round(x), Math.round(y + 7 * s));
  ctx.lineTo(Math.round(x + 18 * s), Math.round(y + 7 * s));
  ctx.lineTo(Math.round(x + 18 * s), Math.round(y + 12 * s));
  ctx.lineTo(Math.round(x + 14 * s), Math.round(y + 14 * s));
  ctx.lineTo(Math.round(x + 4 * s), Math.round(y + 14 * s));
  ctx.lineTo(Math.round(x), Math.round(y + 12 * s));
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#b8c9a3';
  rect(ctx, x + 2 * s, y + 9 * s, 2 * s, 2 * s);
  ctx.fillStyle = SPRITE_COLOR;
};

/** Water frame 1 — 400×20 px full-width */
const water_1: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;
  const W = 400 * s;

  // Wave pattern: repeating arcs
  ctx.beginPath();
  for (let wx = 0; wx < W; wx += 32 * s) {
    ctx.arc(wx + 8 * s, y + 6 * s, 8 * s, Math.PI, 0, false);
    ctx.arc(wx + 24 * s, y + 6 * s, 8 * s, 0, Math.PI, true);
  }
  ctx.fill();

  // Bottom solid band
  rect(ctx, x, y + 10 * s, W, 10 * s);
};

/** Water frame 2 — 400×20 px full-width (phase-offset waves) */
const water_2: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;
  const W = 400 * s;

  // Offset wave pattern by half cycle
  ctx.beginPath();
  for (let wx = -16 * s; wx < W; wx += 32 * s) {
    ctx.arc(wx + 8 * s, y + 6 * s, 8 * s, Math.PI, 0, false);
    ctx.arc(wx + 24 * s, y + 6 * s, 8 * s, 0, Math.PI, true);
  }
  ctx.fill();

  rect(ctx, x, y + 10 * s, W, 10 * s);
};

/** Palm tree left — 44×100 px */
const palm_left: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.fillStyle = SPRITE_COLOR;

  // Trunk
  rect(ctx, x + 18 * s, y + 50 * s, 8 * s, 50 * s);

  // Fronds (left cluster)
  ctx.beginPath();
  ctx.moveTo(Math.round(x + 22 * s), Math.round(y + 50 * s));
  ctx.lineTo(Math.round(x), Math.round(y + 20 * s));
  ctx.lineTo(Math.round(x + 6 * s), Math.round(y + 22 * s));
  ctx.lineTo(Math.round(x + 22 * s), Math.round(y + 55 * s));
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(Math.round(x + 22 * s), Math.round(y + 50 * s));
  ctx.lineTo(Math.round(x + 44 * s), Math.round(y + 15 * s));
  ctx.lineTo(Math.round(x + 40 * s), Math.round(y + 22 * s));
  ctx.lineTo(Math.round(x + 22 * s), Math.round(y + 55 * s));
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(Math.round(x + 22 * s), Math.round(y + 48 * s));
  ctx.lineTo(Math.round(x + 10 * s), Math.round(y));
  ctx.lineTo(Math.round(x + 16 * s), Math.round(y + 4 * s));
  ctx.lineTo(Math.round(x + 24 * s), Math.round(y + 50 * s));
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(Math.round(x + 22 * s), Math.round(y + 48 * s));
  ctx.lineTo(Math.round(x + 30 * s), Math.round(y + 5 * s));
  ctx.lineTo(Math.round(x + 26 * s), Math.round(y + 2 * s));
  ctx.lineTo(Math.round(x + 20 * s), Math.round(y + 50 * s));
  ctx.closePath();
  ctx.fill();
};

/** Palm tree right — 44×100 px (mirrored) */
const palm_right: SpriteDraw = (ctx, x, y, scale = 1) => {
  const s = scale;
  ctx.save();
  // Mirror by translating and flipping horizontally
  ctx.translate(x + 44 * s, 0);
  ctx.scale(-1, 1);
  palm_left(ctx, 0, y, scale);
  ctx.restore();
};

// ── Export ────────────────────────────────────────────────────────────────

export const sprites: Record<SpriteKey, SpriteDraw> = {
  helicopter,
  parachutist_zone0,
  parachutist_zone1,
  parachutist_zone2,
  boat,
  boat_catching,
  shark,
  water_1,
  water_2,
  palm_left,
  palm_right,
};

/** Sprite bounding boxes at scale=1 (width, height) */
export const spriteDimensions: Record<SpriteKey, { w: number; h: number }> = {
  helicopter: { w: 52, h: 24 },
  parachutist_zone0: { w: 24, h: 40 },
  parachutist_zone1: { w: 22, h: 36 },
  parachutist_zone2: { w: 16, h: 22 },
  boat: { w: 48, h: 20 },
  boat_catching: { w: 48, h: 24 },
  shark: { w: 18, h: 14 },
  water_1: { w: 400, h: 20 },
  water_2: { w: 400, h: 20 },
  palm_left: { w: 44, h: 100 },
  palm_right: { w: 44, h: 100 },
};
