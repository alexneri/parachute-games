// lib/game/renderer.ts
// Canvas 2D renderer — LCD background, sprites, ghost effect, overlays
// Spec: docs/architecture.md, T-2.1, T-2.3, T-2.4

import { GameState, SpriteGhost, SpriteKey, RenderFrame } from './types';
import { sprites } from './sprites';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LCD_BG_COLOR,
  SPRITE_COLOR,
  GHOST_OPACITY,
  GHOST_DURATION_MS,
  LCD_SEGMENT_OFF,
  GAME_OVER_OVERLAY,
  BOAT_POSITIONS,
  BOAT_Y,
  HELICOPTER_Y,
  HELICOPTER_SPAWN_X,
  HELICOPTER_STEP_PX,
  HELICOPTER_STEPS,
  ZONE_Y,
  WATER_Y,
  WATER_ANIM_PERIOD_MS,
  PALM_LEFT_X,
  PALM_RIGHT_X,
  PALM_Y,
  SHARK_Y,
  SCORE_DIGIT_X,
  SCORE_Y,
} from './constants';

// ── 7-Segment Display ──────────────────────────────────────────────────────
//
// Standard segment labeling (a=top, b=top-right, c=bot-right, d=bottom,
// e=bot-left, f=top-left, g=middle).
// Each digit has 7 booleans: [a, b, c, d, e, f, g]

const SEG_MAP: Record<string, readonly number[]> = {
  '0': [1, 1, 1, 1, 1, 1, 0],
  '1': [0, 1, 1, 0, 0, 0, 0],
  '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1],
  '4': [0, 1, 1, 0, 0, 1, 1],
  '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1],
  '7': [1, 1, 1, 0, 0, 0, 0],
  '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1],
};

const DIGIT_W = 10; // px per digit
const DIGIT_H = 18; // px per digit
const SEG_T = 2;    // segment thickness

function drawDigit(
  ctx: CanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
): void {
  const segs = SEG_MAP[char] ?? SEG_MAP['8'];
  const onColor = SPRITE_COLOR;
  const offColor = LCD_SEGMENT_OFF;

  // Helper that draws one segment rect with the correct on/off color
  const seg = (on: number, sx: number, sy: number, sw: number, sh: number) => {
    ctx.fillStyle = on ? onColor : offColor;
    ctx.fillRect(sx, sy, sw, sh);
  };

  const [a, b, c, d, e, f, g] = segs;
  const mid = y + DIGIT_H / 2;

  seg(a, x + SEG_T, y, DIGIT_W - 2 * SEG_T, SEG_T);                    // top
  seg(b, x + DIGIT_W - SEG_T, y + SEG_T, SEG_T, DIGIT_H / 2 - SEG_T);  // top-right
  seg(c, x + DIGIT_W - SEG_T, mid + SEG_T, SEG_T, DIGIT_H / 2 - SEG_T);// bot-right
  seg(d, x + SEG_T, y + DIGIT_H - SEG_T, DIGIT_W - 2 * SEG_T, SEG_T);  // bottom
  seg(e, x, mid + SEG_T, SEG_T, DIGIT_H / 2 - SEG_T);                   // bot-left
  seg(f, x, y + SEG_T, SEG_T, DIGIT_H / 2 - SEG_T);                     // top-left
  seg(g, x + SEG_T, mid - SEG_T / 2, DIGIT_W - 2 * SEG_T, SEG_T);      // middle
}

// ── Renderer class ─────────────────────────────────────────────────────────

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private ghosts: SpriteGhost[] = [];

  // Previous entity positions for ghost generation
  private prevBoatPixelX = -1;
  private prevHeliStepIndex = -1;
  private prevParaPositions: Map<string, { x: number; y: number; zone: number }> = new Map();

  // Flash state for PUSH START / GAME OVER animations
  private flashOn = true;
  private flashAccMs = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(frame: RenderFrame): void {
    const { gameState: gs, timestamp } = frame;

    // Update blink animation
    this.flashAccMs += 16; // approx one frame
    if (this.flashAccMs >= 500) {
      this.flashOn = !this.flashOn;
      this.flashAccMs = 0;
    }

    // Generate ghosts from entity movement
    this.generateGhosts(gs, timestamp);

    // ── Draw order ──
    this.drawBackground();
    this.drawPalms();
    this.drawWater(timestamp);
    this.drawGhosts(timestamp);
    this.drawHelicopter(gs);
    this.drawParachutists(gs);
    this.drawBoat(gs, timestamp);
    this.drawShark(gs);
    this.drawScore(gs.score);
    this.drawOverlays(gs, timestamp);
  }

  private drawBackground(): void {
    this.ctx.fillStyle = LCD_BG_COLOR;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawPalms(): void {
    const ctx = this.ctx;
    ctx.fillStyle = SPRITE_COLOR;
    sprites.palm_left(ctx, PALM_LEFT_X, PALM_Y);
    sprites.palm_right(ctx, PALM_RIGHT_X, PALM_Y);
  }

  private drawWater(timestamp: number): void {
    const ctx = this.ctx;
    // Alternate frames at 1Hz
    const frame = Math.floor(timestamp / (WATER_ANIM_PERIOD_MS / 2)) % 2;
    ctx.fillStyle = SPRITE_COLOR;
    if (frame === 0) {
      sprites.water_1(ctx, 0, WATER_Y);
    } else {
      sprites.water_2(ctx, 0, WATER_Y);
    }
  }

  private generateGhosts(gs: GameState, timestamp: number): void {
    // Boat ghost
    const boatPx = BOAT_POSITIONS[gs.boat.position];
    if (this.prevBoatPixelX !== -1 && this.prevBoatPixelX !== boatPx) {
      this.ghosts.push({
        spriteKey: 'boat',
        x: this.prevBoatPixelX - 24, // centered
        y: BOAT_Y - 10,
        opacity: GHOST_OPACITY,
        spawnedAt: timestamp,
      });
    }
    this.prevBoatPixelX = boatPx;

    // Helicopter ghost
    if (gs.helicopter.isTraversing) {
      if (this.prevHeliStepIndex !== -1 && this.prevHeliStepIndex !== gs.helicopter.stepIndex) {
        const prevPx = this.heliPixelX(this.prevHeliStepIndex);
        this.ghosts.push({
          spriteKey: 'helicopter',
          x: prevPx - 26,
          y: HELICOPTER_Y - 12,
          opacity: GHOST_OPACITY,
          spawnedAt: timestamp,
        });
        this.prevHeliStepIndex = gs.helicopter.stepIndex;
      } else if (this.prevHeliStepIndex === -1) {
        this.prevHeliStepIndex = gs.helicopter.stepIndex;
      }
    } else {
      this.prevHeliStepIndex = -1;
    }

    // Parachutist ghosts
    for (const para of gs.parachutists) {
      if (para.state !== 'falling') continue;
      const prev = this.prevParaPositions.get(para.id);
      const currY = ZONE_Y[para.zone];
      const currX = BOAT_POSITIONS[para.xPosition] - this.paraHalfWidth(para.zone);

      if (prev && (prev.x !== currX || prev.y !== currY)) {
        this.ghosts.push({
          spriteKey: this.paraZoneKey(prev.zone),
          x: prev.x,
          y: prev.y,
          opacity: GHOST_OPACITY,
          spawnedAt: timestamp,
        });
      }
      this.prevParaPositions.set(para.id, { x: currX, y: currY, zone: para.zone });
    }
    // Clean up parachutists no longer in flight
    for (const id of this.prevParaPositions.keys()) {
      if (!gs.parachutists.find((p) => p.id === id && p.state === 'falling')) {
        this.prevParaPositions.delete(id);
      }
    }
  }

  private drawGhosts(now: number): void {
    const ctx = this.ctx;
    ctx.save();

    this.ghosts = this.ghosts.filter((g) => {
      const age = now - g.spawnedAt;
      if (age >= GHOST_DURATION_MS) return false;

      const opacity = GHOST_OPACITY * (1 - age / GHOST_DURATION_MS);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = SPRITE_COLOR;
      sprites[g.spriteKey](ctx, g.x, g.y);
      return true;
    });

    ctx.restore();
  }

  private drawHelicopter(gs: GameState): void {
    if (!gs.helicopter.isTraversing) return;
    const px = this.heliPixelX(gs.helicopter.stepIndex);
    const ctx = this.ctx;
    ctx.fillStyle = SPRITE_COLOR;
    sprites.helicopter(ctx, px - 26, HELICOPTER_Y - 12);
  }

  private drawParachutists(gs: GameState): void {
    const ctx = this.ctx;
    ctx.fillStyle = SPRITE_COLOR;
    for (const para of gs.parachutists) {
      if (para.state !== 'falling') continue;
      const spriteKey = this.paraZoneKey(para.zone);
      const halfW = this.paraHalfWidth(para.zone);
      const x = BOAT_POSITIONS[para.xPosition] - halfW;
      const y = ZONE_Y[para.zone];
      sprites[spriteKey](ctx, x, y);
    }
  }

  private drawBoat(gs: GameState, timestamp: number): void {
    const catching =
      gs.phase === 'playing' &&
      gs.parachutists.some(
        (p) => p.state === 'caught' || (p.zone === 2 && p.xPosition === gs.boat.position),
      );
    const spriteKey: SpriteKey = catching ? 'boat_catching' : 'boat';
    const px = BOAT_POSITIONS[gs.boat.position];
    const ctx = this.ctx;
    ctx.fillStyle = SPRITE_COLOR;
    sprites[spriteKey](ctx, px - 24, BOAT_Y - 10);
    void timestamp; // unused but part of signature
  }

  private drawShark(gs: GameState): void {
    if (!gs.shark.visible) return;
    const px = BOAT_POSITIONS[gs.shark.xPosition];
    const ctx = this.ctx;
    ctx.fillStyle = SPRITE_COLOR;
    sprites.shark(ctx, px - 9, SHARK_Y);
  }

  private drawScore(score: number): void {
    const digits = String(score).padStart(3, '0').slice(-3);
    const ctx = this.ctx;
    for (let i = 0; i < 3; i++) {
      drawDigit(ctx, digits[i], SCORE_DIGIT_X[i], SCORE_Y);
    }
  }

  private drawOverlays(gs: GameState, _timestamp: number): void {
    const ctx = this.ctx;

    // MISS text
    if (gs.phase === 'miss_flash' && gs.missFlashMs > 0) {
      this.drawMissText();
    }

    // GAME OVER
    if (gs.phase === 'game_over') {
      this.drawGameOver(gs);
    }

    // PUSH START (attract)
    if (gs.phase === 'attract') {
      if (this.flashOn) {
        this.drawPushStart();
      }
    }

    // PAUSED
    if (gs.phase === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.drawCenteredText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 16);
    }
  }

  private drawMissText(): void {
    const ctx = this.ctx;
    ctx.fillStyle = SPRITE_COLOR;
    this.drawBlockLetters('MISS', 290, 240, 12);
  }

  private drawGameOver(gs: GameState): void {
    const ctx = this.ctx;

    // Semi-transparent overlay
    ctx.fillStyle = GAME_OVER_OVERLAY;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // GAME OVER text
    ctx.fillStyle = SPRITE_COLOR;
    this.drawCenteredText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, 18);

    // Final score
    this.drawCenteredText(`SCORE  ${gs.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5, 13);

    // Flashing PUSH START
    if (this.flashOn) {
      this.drawCenteredText('PUSH START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 28, 12);
    }
  }

  private drawPushStart(): void {
    this.drawCenteredText('PUSH START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30, 12);
  }

  private drawCenteredText(
    text: string,
    cx: number,
    cy: number,
    size: number,
  ): void {
    const ctx = this.ctx;
    ctx.fillStyle = SPRITE_COLOR;
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
  }

  /** Blocky uppercase text using fillRect (no system font) */
  private drawBlockLetters(text: string, x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = SPRITE_COLOR;
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private heliPixelX(stepIndex: number): number {
    return HELICOPTER_SPAWN_X - (HELICOPTER_STEPS - stepIndex) * HELICOPTER_STEP_PX;
  }

  private paraZoneKey(zone: number): SpriteKey {
    if (zone === 0) return 'parachutist_zone0';
    if (zone === 1) return 'parachutist_zone1';
    return 'parachutist_zone2';
  }

  private paraHalfWidth(zone: number): number {
    if (zone === 0) return 12;
    if (zone === 1) return 11;
    return 8;
  }
}
