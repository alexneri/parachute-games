'use client';

// app/page.tsx
// Game page — wires DeviceFrame, GameCanvas, ScoreDisplay
// Spec: T-2.5, T-4.1, T-4.2

import { useState } from 'react';
import DeviceFrame from '../components/DeviceFrame';
import GameCanvas from '../components/GameCanvas';
import ScoreDisplay from '../components/ScoreDisplay';
import { GameMode } from '../lib/game/types';

export default function GamePage() {
  const [mode, setMode] = useState<GameMode>('A');
  const [muted, setMuted] = useState(false);

  return (
    <main className="page-layout">
      <div className="device-container">
        <DeviceFrame
          mode={mode}
          onModeChange={setMode}
          muted={muted}
          onMuteToggle={() => setMuted((m) => !m)}
        >
          <GameCanvas mode={mode} muted={muted} />
        </DeviceFrame>

        <ScoreDisplay />
      </div>
    </main>
  );
}
