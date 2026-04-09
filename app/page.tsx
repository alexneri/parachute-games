'use client';

// T-0.1 scaffold — game components will be wired in T-2.1 / T-2.5
export default function GamePage() {
  return (
    <main className="page-layout">
      <div className="device-container">
        <div className="device-outer" role="main" aria-label="Parachute Game & Watch">
          <p className="label-top">Parachute</p>

          <div className="screen-bezel">
            <div className="screen-inner">
              {/* <GameCanvas /> will be mounted here (T-2.1) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#1a1a1a',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  opacity: 0.5,
                }}
              >
                scaffold ready — T-0.1 complete
              </div>
            </div>
          </div>

          <p className="label-bottom">Wide Screen</p>

          <div className="controls-row">
            <button
              className="mode-btn mode-btn-a"
              aria-pressed="true"
              aria-label="Game A mode"
              type="button"
            >
              A
            </button>

            <button className="mute-btn" aria-label="Mute" aria-pressed="false" type="button">
              {/* Speaker SVG — will be extracted to MuteToggle component in T-2.5 */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 3L5 7H2v6h3l5 4V3z" />
                <path d="M14.5 6.5a5 5 0 0 1 0 7M17 4a8 8 0 0 1 0 12" opacity="0.7" />
              </svg>
            </button>

            <button
              className="mode-btn mode-btn-b"
              aria-pressed="false"
              aria-label="Game B mode"
              type="button"
            >
              B
            </button>
          </div>
        </div>

        {/* Keyboard hint — visible on desktop */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 11,
            color: 'rgba(184, 201, 163, 0.5)',
            fontFamily: 'monospace',
          }}
        >
          ← / → to move · Enter to start · M to mute
        </p>
      </div>
    </main>
  );
}
