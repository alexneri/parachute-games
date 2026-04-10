'use client';

// components/DeviceFrame.tsx
// Presentational device shell — cream plastic frame, rose bezel, labels, controls
// Spec: T-2.5, FR13, docs/front-end-spec.md

import { GameMode } from '../lib/game/types';

interface DeviceFrameProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  muted: boolean;
  onMuteToggle: () => void;
  children: React.ReactNode;
}

export default function DeviceFrame({
  mode,
  onModeChange,
  muted,
  onMuteToggle,
  children,
}: DeviceFrameProps) {
  return (
    <div className="device-outer" role="main" aria-label="Parachute Game & Watch">
      {/* Top label */}
      <p className="label-top" aria-hidden="true">
        Parachute
      </p>

      {/* Screen bezel + canvas */}
      <div className="screen-bezel">
        <div className="screen-inner">{children}</div>
      </div>

      {/* Bottom label */}
      <p className="label-bottom" aria-hidden="true">
        Wide Screen
      </p>

      {/* Controls row */}
      <div className="controls-row" role="group" aria-label="Game controls">
        <button
          className="mode-btn mode-btn-a"
          aria-pressed={mode === 'A'}
          aria-label="Game A — standard speed"
          type="button"
          onClick={() => onModeChange('A')}
        >
          A
        </button>

        <button
          className="mute-btn"
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          aria-pressed={muted}
          type="button"
          onClick={onMuteToggle}
        >
          {muted ? (
            // Muted icon
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 3L5 7H2v6h3l5 4V3z" />
              <line x1="14" y1="8" x2="19" y2="13" stroke="currentColor" strokeWidth="2" />
              <line x1="19" y1="8" x2="14" y2="13" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            // Sound-on icon
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 3L5 7H2v6h3l5 4V3z" />
              <path d="M14.5 6.5a5 5 0 0 1 0 7" opacity="0.8" />
              <path d="M17 4a8 8 0 0 1 0 12" opacity="0.5" />
            </svg>
          )}
        </button>

        <button
          className="mode-btn mode-btn-b"
          aria-pressed={mode === 'B'}
          aria-label="Game B — faster speed"
          type="button"
          onClick={() => onModeChange('B')}
        >
          B
        </button>
      </div>

      {/* Keyboard hint (desktop only) */}
      <p
        style={{
          textAlign: 'center',
          marginTop: 10,
          marginBottom: 0,
          fontSize: 10,
          color: 'rgba(42, 42, 42, 0.45)',
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
        }}
        aria-hidden="true"
      >
        ← / → to move · Enter to start · M to mute
      </p>
    </div>
  );
}
