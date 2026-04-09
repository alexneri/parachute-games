// lib/hooks/useGameLoop.ts
// requestAnimationFrame loop with fixed-timestep physics accumulator
// Spec: docs/architecture.md "Game Loop Timing", T-2.1

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { GameRenderer } from '../game/renderer';
import { GameState } from '../game/types';
import { GAME_A_TICK_MS, GAME_B_TICK_MS } from '../game/constants';
import { AudioSynthesizer } from '../audio/synthesizer';

interface UseGameLoopOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  engineRef: React.RefObject<GameEngine | null>;
  rendererRef: React.RefObject<GameRenderer | null>;
  synthRef: React.RefObject<AudioSynthesizer | null>;
}

export function useGameLoop({
  canvasRef,
  engineRef,
  rendererRef,
  synthRef,
}: UseGameLoopOptions): GameState | null {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumRef = useRef<number>(0);

  // Track prev state for sound triggers
  const prevScoreRef = useRef<number>(0);
  const prevMissesRef = useRef<number>(0);
  const prevPhaseRef = useRef<string>('attract');

  const loop = useCallback(
    (timestamp: number) => {
      const engine = engineRef.current;
      const renderer = rendererRef.current;
      const canvas = canvasRef.current;

      if (!engine || !renderer || !canvas) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Delta since last frame (cap at 200ms to avoid spiral-of-death on tab restore)
      const delta = Math.min(timestamp - lastTimeRef.current, 200);
      lastTimeRef.current = timestamp;

      const state = engine.getState();
      const tickMs = state.mode === 'A' ? GAME_A_TICK_MS : GAME_B_TICK_MS;

      // Fixed-timestep physics accumulator
      accumRef.current += delta;
      while (accumRef.current >= tickMs) {
        engine.tick(tickMs);
        accumRef.current -= tickMs;
      }

      const newState = engine.getState();

      // ── Trigger sounds on state changes ──
      const synth = synthRef.current;
      if (synth && newState.soundEnabled) {
        if (newState.score > prevScoreRef.current) {
          synth.playCatch();
        }
        if (newState.misses > prevMissesRef.current) {
          synth.playMiss();
        }
        if (newState.phase === 'game_over' && prevPhaseRef.current !== 'game_over') {
          synth.playGameOver();
        }
      }
      prevScoreRef.current = newState.score;
      prevMissesRef.current = newState.misses;
      prevPhaseRef.current = newState.phase;

      // Render
      renderer.render({ gameState: newState, ghosts: [], timestamp });

      // Push state snapshot to React
      setGameState({ ...newState });

      rafRef.current = requestAnimationFrame(loop);
    },
    [canvasRef, engineRef, rendererRef, synthRef],
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    // Pause when tab hidden, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else {
        // Reset lastTime so delta doesn't explode on resume
        lastTimeRef.current = performance.now();
        accumRef.current = 0;
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [loop]);

  return gameState;
}
