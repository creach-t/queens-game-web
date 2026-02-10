# CLAUDE.md - Queens Game Web

## Project Overview

Queens Game Web is a browser-based puzzle game inspired by LinkedIn's Queens Game. Players place queens on a colored grid so that each row, column, and region contains exactly one queen with no two queens adjacent (including diagonals).

Levels are loaded from Firebase (no client-side generation).

Live: https://queens-game.creachtheo.fr

## Tech Stack

- **Framework**: React 18.2 + TypeScript 5.0
- **Build**: Vite 5.1 (dev server on port 3000)
- **Styling**: Tailwind CSS (utility-first, `clsx` + `tailwind-merge`)
- **Icons**: Lucide React
- **Backend**: Firebase 11.9.1 (Realtime Database for levels, Auth)
- **SVG**: vite-plugin-svgr (import SVGs as components)
- **Deploy**: Docker + Nginx + Traefik (VPS), CI/CD via GitHub Actions + GHCR

## Commands

```bash
npm run dev          # Dev server at localhost:3000 (auto-opens browser)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

No test framework is configured. CI runs type-check + build as validation.

## Project Structure

```
src/
├── components/
│   ├── Game.tsx              # Main game orchestrator (loading/error states)
│   ├── GameCell.tsx          # Individual cell (React.memo, queen/marker/empty)
│   ├── Timer.tsx             # MM:SS timer display
│   ├── Leaderboard.tsx       # Top 3 leaderboard with save form (always visible)
│   ├── GameBoard/
│   │   ├── index.tsx         # Board wrapper (responsive resize, useCallback)
│   │   ├── BoardGrid.tsx     # Grid rendering (event delegation, touch swipe)
│   │   ├── AnimationOverlay.tsx  # CSS-based animation overlay
│   │   └── LoadingState.tsx
│   └── GameControls/
│       ├── index.tsx         # Controls container + leaderboard integration
│       ├── MainControls.tsx  # Reset / New game
│       ├── Rules.tsx         # Rules display
│       ├── SizeGridSelector.tsx  # Grid size picker (5-12)
│       └── SuccessMessage.tsx    # Victory message (simplified)
├── hooks/
│   ├── useGameLogic.ts       # Core game state (Firebase loading, timer, single-render clicks)
│   └── useAnimations.ts      # Spiral animations (requestAnimationFrame)
├── lib/
│   └── rules.ts              # Pure game rule validation (Map-based indexing)
├── types/
│   └── game.ts               # All TypeScript interfaces
├── utils/
│   ├── boardUtils.ts         # Border styles, corner classes
│   ├── levelStorage.ts       # Firebase (levels + leaderboard with 30s cache)
│   └── gameUtils.ts          # Board init/reset helpers
├── constants/
│   └── index.ts              # Region color palette (12 pastel colors)
├── App.tsx                   # Root component
├── main.tsx                  # Entry point
└── index.css                 # Global Tailwind styles + animation keyframes
```

## Architecture

- **State management**: `useState` + `useCallback` in custom hooks (no Redux/Zustand)
- **Validation**: Synchronous within single `setGameState` callback (no deferred setTimeout)
- **Cell click cycle**: empty → marked → queen → empty
- **Touch swipe**: Sliding on mobile marks multiple empty cells in one gesture
- **Level loading**: Firebase-only via `levelStorage.getRandomLevel()`
- **Timer**: `useRef<setInterval>`, starts when grid becomes visible, continues on reset, stops on completion
- **Animations**: Single `requestAnimationFrame` loop with Set-based spiral order (memoized)
- **Memoization**: `React.memo` on GameCell with custom comparator, `useMemo` for border styles
- **Event delegation**: Single click handler on grid container (data-row/data-col attributes)
- **Leaderboard**: Top 3 per grid size, 30s client cache, name-based updates, shown only if eligible
- **Path alias**: `@/*` maps to `./src/*`

## Key Files for Common Tasks

- **Game rules/validation**: `src/lib/rules.ts` — pure functions, Map-based indexing
- **Game state/logic**: `src/hooks/useGameLogic.ts` — main hook for gameplay
- **Type definitions**: `src/types/game.ts` — all interfaces
- **Level loading + leaderboard**: `src/utils/levelStorage.ts` — Firebase persistence with caching
- **Leaderboard UI**: `src/components/Leaderboard.tsx` — top 3, save form, eligibility check
- **Firebase setup**: `FIREBASE_SETUP.md` — rules configuration guide
- **Firebase monitoring**: `FIREBASE_MONITORING.md` — bandwidth optimization & alerts
- **Build config**: `vite.config.ts` (code splitting: Firebase + React as separate chunks)

## CI/CD Pipeline

```
push main → GitHub Actions → type-check → build → Docker image → GHCR → SSH deploy VPS
```

- **Workflow**: `.github/workflows/deploy.yml`
- **Registry**: GitHub Container Registry (ghcr.io)
- **Deploy**: SCP docker-compose.prod.yml + SSH pull & restart
- **Zero-downtime**: Docker HEALTHCHECK + Traefik auto-routing
- **Secrets**: VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_DEPLOY_PATH, GHCR_PAT, 7x VITE_FIREBASE_*

## Code Conventions

- **Components**: PascalCase, functional with `React.FC`, props via destructured interfaces
- **Hooks**: `use*` prefix, extracted into `src/hooks/`
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/interfaces**: PascalCase, centralized in `src/types/`
- **Styling**: Tailwind utility classes; inline `style` for dynamic colors (region backgrounds)

## Leaderboard System

- **Storage**: Firebase Realtime Database (`leaderboards/grid_{size}`)
- **Top 3 only**: Reduces bandwidth by 70% vs top 10
- **Name-based updates**: Same player name = update if better time, prevents duplicates
- **Eligibility check**: Save form only shown if time qualifies for top 3
- **Name persistence**: After first save, player name is remembered and pre-filled as placeholder in form
- **Smart save**: If name field is empty, uses the saved name from previous win
- **Client-side cache**: 30-second cache prevents excessive Firebase requests
- **Anonymous auth**: Required for write access (Firebase rules)
- **Always visible**: Leaderboard displays on page load, not just after completion

See `FIREBASE_SETUP.md` for rules configuration and `FIREBASE_MONITORING.md` for usage optimization.

## Environment

- `.env` for Firebase config (see `.env.example` for template)
- Docker: multi-stage build (node → nginx), `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod/GHCR)
- TypeScript strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- Firebase rules: See `firebase-rules.json` for production security configuration
