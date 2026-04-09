'use client';

// components/GameCanvas.tsx
// Canvas element mount, DPI setup, game engine + renderer lifecycle
// Spec: T-2.1, T-4.2, docs/architecture.md

import { useEffect, useRef } from 'react';
import { GameEngine } from '../lib/game/engine';
import { GameRenderer } from '../lib/game/renderer';
import { AudioSynthesizer } from '../lib/audio/synthesizer';
import { useGameLoop } from '../lib/hooks/useGameLoop';
import { useInput } from '../lib/hooks/useInput';
import { GameMode } from '../lib/game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../lib/game/constants';

interface GameCanvasProps {
  mode: GameMode;
  muted: boolean;
  onModeChange?: (mode: GameMode) => void;
}

export default function GameCanvas({ mode, muted }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const synthRef = useRef<AudioSynthesizer | null>(null);

  // Bootstrap engine, renderer, synthesizer once on mount
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine(mode);
    }
    if (!synthRef.current) {
      synthRef.current = new AudioSynthesizer();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync mode prop → engine
  useEffect(() => {
    engineRef.current?.setMode(mode);
  }, [mode]);

  // Sync muted prop → synthesizer
  useEffect(() => {
    synthRef.current?.setMuted(muted);
    const state = engineRef.current?.getState();
    if (state) {
      (state as { soundEnabled: boolean }).soundEnabled = !muted;
    }
  }, [muted]);

  // Canvas setup: create renderer, handle DPI scaling, ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx);

    function setupCanvas() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || CANVAS_WIDTH;
      const cssH = rect.height || CANVAS_HEIGHT;

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Scale so logical coords map to physical pixels
      const scaleX = canvas.width / CANVAS_WIDTH;
      const scaleY = canvas.height / CANVAS_HEIGHT;
      ctx.scale(scaleX, scaleY);
    }

    setupCanvas();

    const ro = new ResizeObserver(setupCanvas);
    ro.observe(canvas);

    return () => {
      ro.disconnect();
    };
  }, []);

  // Start the game loop
  useGameLoop({ canvasRef, engineRef, rendererRef, synthRef });

  // Attach input handlers
  useInput({ engineRef, synthRef, canvasRef });

  return (
    <canvas
      ref={canvasRef}
      aria-label="Parachute game — press Enter to start, arrow keys to move"
      role="img"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
    />
  );
}
