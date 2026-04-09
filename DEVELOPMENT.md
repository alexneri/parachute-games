# Development Guide

## Prerequisites

- Node.js 20+ (use [nvm](https://github.com/nvm-sh/nvm) if you manage multiple versions)
- npm 10+

## Setup

```bash
git clone https://github.com/alexneri/parachute-games.git
cd parachute-games
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build (static export to `out/`) |
| `npm run type-check` | TypeScript type check (no emit) |
| `npm run lint` | ESLint with Next.js rules |
| `npm run test` | Run Vitest unit tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run format` | Prettier format all files |

All four checks (`type-check`, `lint`, `test`, `build`) must pass before merging.

## Project Structure

```
parachute-games/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout, metadata, viewport
│   ├── page.tsx            # Single page — renders DeviceFrame + GameCanvas
│   └── globals.css         # Tailwind directives + CSS custom properties
├── components/             # React components (created in T-2.5)
│   ├── DeviceFrame.tsx
│   ├── GameCanvas.tsx
│   └── ScoreDisplay.tsx
├── lib/
│   ├── game/
│   │   ├── types.ts        # All TypeScript interfaces (GameState, etc.)
│   │   ├── constants.ts    # All numeric/string constants
│   │   ├── engine.ts       # GameEngine class (T-1.1)
│   │   ├── renderer.ts     # GameRenderer class (T-2.1)
│   │   └── sprites.ts      # Sprite draw functions (T-2.2)
│   ├── audio/
│   │   └── synthesizer.ts  # AudioSynthesizer class (T-3.1)
│   └── hooks/
│       ├── useGameLoop.ts  # rAF loop hook (T-2.1)
│       └── useInput.ts     # Keyboard + touch input hook (T-1.4)
├── __tests__/              # Vitest unit tests
│   ├── engine.test.ts
│   ├── renderer.test.ts
│   └── synthesizer.test.ts
├── docs/                   # All specification documents
└── public/                 # Static assets (currently empty — sprites are vector)
```

## Git Workflow

1. **Branch naming**: `feat/<task-id>-short-description` (e.g. `feat/t-1.1-game-engine`)
2. **One task per branch** — map to the task IDs in `docs/atomized-implementation-plan.md`
3. **Commits**: Use conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`
4. **PRs**: Fill the PR template; link the task ID in the description
5. **Merge**: Squash merge into `main`; all CI checks must be green

## Implementation Order

Follow the dependency graph in `docs/atomized-implementation-plan.md`. The minimum sequential path:

```
T-0.1 → T-1.1 → T-1.2 → T-1.3 → T-1.5 → T-1.7 → T-INT-1 → T-5.2
```

With 3 parallel engineers, tracks A (engine), B (renderer), and D (audio) can run simultaneously after T-0.1.

## Writing Tests

Tests live in `__tests__/` and use [Vitest](https://vitest.dev/) + `@testing-library/react`.

**Unit test example (engine)**:
```typescript
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../lib/game/engine';

describe('GameEngine', () => {
  it('initialises in attract phase', () => {
    const engine = new GameEngine('A');
    expect(engine.getState().phase).toBe('attract');
  });
});
```

**Mocking AudioContext** (synthesizer tests):
```typescript
import { vi } from 'vitest';

const mockCtx = {
  createOscillator: vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { setValueAtTime: vi.fn() } })),
  createGain: vi.fn(() => ({ connect: vi.fn(), gain: { setValueAtTime: vi.fn() } })),
  destination: {},
  currentTime: 0,
};
vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));
```

## Debugging

- **Game state**: `engine.getState()` returns a plain object — log it freely
- **Canvas rendering**: Wrap `renderer.render(frame)` in a try/catch during development
- **Ghost list**: Access `renderer['ghosts']` in the browser console (it's a private field, use DevTools)
- **Timing**: The `GAME_A_TICK_MS` / `GAME_B_TICK_MS` constants can be temporarily lowered to speed up testing

## Key Decisions (Read Before Changing)

| Decision | Rationale |
|---|---|
| `GameEngine` is a class, not a reducer | Owns mutable tick accumulator; React renders from snapshots |
| AudioContext initialised on first input | Safari blocks autoplay; see Gap 4 in `docs/atomized-implementation-plan.md` |
| Static export (`output: 'export'`) | Zero backend; served from Vercel Edge CDN |
| All sprites are vector (Path2D) | Keeps bundle well under 200KB; no image assets needed |
| Fixed-timestep physics | Deterministic across 30fps and 60fps displays |

## Specification References

| Topic | Document |
|---|---|
| What to build | `docs/prd.md` |
| System design | `docs/architecture.md` |
| Task breakdown | `docs/atomized-implementation-plan.md` |
| Visual design | `docs/front-end-spec.md`, `docs/design-system-parachute-game-2026-04-09.md` |
| Per-story detail | `docs/stories/` |
