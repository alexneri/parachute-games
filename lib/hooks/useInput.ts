// lib/hooks/useInput.ts
// Keyboard + touch input handler
// Spec: docs/architecture.md, T-3.2, T-4.3

'use client';

import { useEffect } from 'react';
import { GameEngine } from '../game/engine';
import { AudioSynthesizer } from '../audio/synthesizer';

interface UseInputOptions {
  engineRef: React.RefObject<GameEngine | null>;
  synthRef: React.RefObject<AudioSynthesizer | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useInput({ engineRef, synthRef, canvasRef }: UseInputOptions): void {
  useEffect(() => {
    function ensureAudio() {
      synthRef.current?.ensureContext();
    }

    function handleKeyDown(e: KeyboardEvent) {
      ensureAudio();
      const engine = engineRef.current;
      if (!engine) return;

      const phase = engine.getState().phase;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          engine.moveBoat('left');
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          engine.moveBoat('right');
          break;
        case 'Enter':
        case 'Space':
          e.preventDefault();
          if (phase === 'game_over') {
            engine.restart();
          } else {
            engine.startGame();
          }
          break;
        case 'KeyM':
          if (synthRef.current) {
            synthRef.current.setMuted(!synthRef.current.isMuted());
            const state = engine.getState();
            // Toggle soundEnabled on engine state (for mute icon)
            (state as { soundEnabled: boolean }).soundEnabled = !synthRef.current.isMuted();
          }
          break;
        default:
          break;
      }
    }

    function handleTouchStart(e: TouchEvent) {
      ensureAudio();
      const engine = engineRef.current;
      const canvas = canvasRef.current;
      if (!engine || !canvas) return;

      // Prevent scroll / double-tap zoom
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const canvasW = rect.width;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const relX = touch.clientX - rect.left;
        const relXRatio = relX / canvasW;
        const phase = engine.getState().phase;

        if (relXRatio < 0.3) {
          engine.moveBoat('left');
        } else if (relXRatio > 0.7) {
          engine.moveBoat('right');
        } else {
          // Center tap — start / pause / restart
          if (phase === 'game_over') {
            engine.restart();
          } else {
            engine.startGame();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [engineRef, synthRef, canvasRef]);
}
