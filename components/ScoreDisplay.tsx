'use client';

// components/ScoreDisplay.tsx
// High-score badge rendered outside the canvas (below the device frame)
// Spec: T-2.5

import { getHighScore } from '../lib/game/constants';

interface ScoreDisplayProps {
  currentScore?: number;
}

export default function ScoreDisplay({ currentScore = 0 }: ScoreDisplayProps) {
  const highScore = getHighScore();

  if (highScore === 0 && currentScore === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        marginTop: 12,
        fontSize: 11,
        color: 'rgba(184, 201, 163, 0.6)',
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      }}
      aria-live="polite"
    >
      {currentScore > 0 && <span>SCORE {String(currentScore).padStart(3, '0')}</span>}
      {highScore > 0 && <span>BEST {String(highScore).padStart(3, '0')}</span>}
    </div>
  );
}
