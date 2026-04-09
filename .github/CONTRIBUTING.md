# Contributing

Thanks for your interest in Parachute! This is an open-source preservation project — contributions are welcome.

## Before You Start

1. Read `DEVELOPMENT.md` for local setup and workflow.
2. Find the task you want to work on in `docs/atomized-implementation-plan.md`.
3. Check if a GitHub issue already exists for that task; if not, open one.

## Branch & PR Process

1. Fork the repository (external contributors) or create a branch (team).
2. Name your branch: `feat/<task-id>-short-description`
   - Example: `feat/t-2-2-sprite-system`
3. Keep one task per PR. Smaller PRs merge faster.
4. Fill out the PR description — include the task ID and tick off acceptance criteria.
5. All CI checks must be green before review.

## Acceptance Criteria

Each task in `docs/atomized-implementation-plan.md` has explicit acceptance criteria.  
Your PR should satisfy all of them. Link the task ID in your PR description.

## Code Style

- **TypeScript strict mode** — no `any`, no type assertions without justification.
- **Prettier** formats automatically — run `npm run format` before committing.
- **ESLint** catches quality issues — run `npm run lint` before committing.
- No commented-out code, no debug `console.log` in committed files.

## Testing

- New game logic (engine, renderer, audio) must have unit tests in `__tests__/`.
- See the testing examples in `DEVELOPMENT.md`.
- `npm run test` must pass with 0 failures.

## License

By contributing, you agree that your work is licensed under [MIT](../LICENSE).
