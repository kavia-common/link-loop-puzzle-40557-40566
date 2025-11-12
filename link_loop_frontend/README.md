# Link Loop Frontend (React)

A modern, lightweight React implementation of the Link Loop puzzle.

Goal: Connect numbers in ascending order (1 → 2 → 3 → … → 9) across a grid using a single continuous path that visits every cell exactly once.

## Features

- Ocean Professional theme with blue and amber accents
- Responsive, accessible grid with pointer and touch support
- Smooth SVG path animation for drawing
- Undo and Reset controls
- Timer with pause on completion and explicit Start/Restart controls (timer starts when Start is clicked)
- Validation for cell coverage, adjacency, and digit order
- Optional leaderboard integration via environment variable (backend is optional)
- Minimal dependencies, no heavy UI framework

## Getting Started

Install dependencies and run:

- npm start
- npm test
- npm run build

Visit http://localhost:3000.

## Environment Variables

The app uses these optional env vars:

- REACT_APP_BACKEND_URL: If provided, enables leaderboard fetch/submit via `${REACT_APP_BACKEND_URL}/leaderboard`
- REACT_APP_API_BASE: Alternative to the above; first non-empty wins
- REACT_APP_FRONTEND_URL, REACT_APP_WS_URL, REACT_APP_NODE_ENV, REACT_APP_NEXT_TELEMETRY_DISABLED, REACT_APP_ENABLE_SOURCE_MAPS, REACT_APP_PORT, REACT_APP_TRUST_PROXY, REACT_APP_LOG_LEVEL, REACT_APP_HEALTHCHECK_PATH, REACT_APP_FEATURE_FLAGS, REACT_APP_EXPERIMENTS_ENABLED: Not required for core gameplay, included for platform compatibility

Create a `.env.local` as needed. Do not commit secrets.

## Code Structure

- src/theme.js: Theme tokens and CSS variable application
- src/utils/gameUtils.js: Grid generation, path building, validation, formatting
- src/hooks/useGameState.js: Core game state, interactions, undo/reset, validation
- src/hooks/useTimer.js: Simple timer with pause/resume/reset
- src/components/Grid.jsx: Responsive grid and animated path overlay
- src/components/PathSVG.jsx: SVG path rendering with stroke animation
- src/components/TopBar.jsx: Timer, moves, undo/reset, leaderboard button
- src/components/CompletionModal.jsx: Completion summary and score submission
- src/services/leaderboard.js: Optional backend integration

## Accessibility

- The grid uses role="application" and is fully pointer/touch accessible.
- Live regions for timer text updates are minimized to avoid noise; summary shown on completion.

## Notes

- Numbers 1..9 are placed along a randomized Hamiltonian path (vertical, horizontal, and mixed turns) that traverses all cells once; digit spacing is randomized using a seed.
- The game starts in a ready state; drawing is disabled and the timer is idle until you click Start. Start/Restart regenerates the layout (digits and target path constraints) for variety.
