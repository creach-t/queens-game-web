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
│   ├── GameStats.tsx         # Online players + games won (real-time, discrete UI)
│   ├── Timer.tsx             # MM:SS timer display
│   ├── Leaderboard.tsx       # Top 3 leaderboard (read-only, no form)
│   ├── GameBoard/
│   │   ├── index.tsx         # Board wrapper (responsive resize, useCallback)
│   │   ├── BoardGrid.tsx     # Grid rendering (event delegation, touch swipe)
│   │   ├── AnimationOverlay.tsx  # CSS-based animation overlay
│   │   └── LoadingState.tsx
│   └── GameControls/
│       ├── index.tsx         # Overlay-based controls with centered board
│       ├── MainControls.tsx  # Reset / New game (with icons + text labels)
│       ├── Rules.tsx         # Comprehensive rules popup (enhanced)
│       ├── SizeGridSelector.tsx  # Grid size picker (5-12, localStorage)
│       └── SuccessMessage.tsx    # Victory popup with leaderboard form
├── hooks/
│   ├── useGameLogic.ts       # Core game state (Firebase, timer, grid size persistence)
│   └── useAnimations.ts      # Spiral animations (requestAnimationFrame)
├── lib/
│   └── rules.ts              # Pure game rule validation (Map-based indexing)
├── types/
│   └── game.ts               # All TypeScript interfaces
├── utils/
│   ├── boardUtils.ts         # Border styles, corner classes
│   ├── levelStorage.ts       # Firebase (levels, stats, presence, level weighting)
│   └── gameUtils.ts          # Board init/reset helpers
├── constants/
│   └── index.ts              # Region color palette (12 pastel colors)
├── App.tsx                   # Root component with SEO content
├── main.tsx                  # Entry point
└── index.css                 # Global Tailwind styles + animation keyframes

public/
├── robots.txt                # SEO: crawling rules
├── sitemap.xml               # SEO: site structure
└── manifest.json             # PWA manifest (optimized)
```

## Architecture

### UI/UX Design (Feb 2026 Update)
- **Layout**: Overlay-based interface with floating controls
- **Structure**: Header → Top overlays → Centered board → Bottom overlays → Footer
- **Grid Layout**: CSS Grid (3 columns) for perfect centering
- **Top Controls**: Rules (?), Timer (center), Leaderboard/Trophy (right)
- **Bottom Controls**: Difficulty selector, Actions (center), Spacer
- **Victory Flow**: Centered popup with leaderboard form (if Top 3)
- **Mobile**: Trophy icon popup for leaderboard, compact controls

### Core Architecture
- **State management**: `useState` + `useCallback` in custom hooks (no Redux/Zustand)
- **Validation**: Synchronous within single `setGameState` callback (no deferred setTimeout)
- **Cell click cycle**: empty → marked → queen → empty
- **Touch swipe**: Sliding on mobile marks multiple empty cells in one gesture
- **Level loading**: Firebase-only via `levelStorage.getRandomLevel()` with weighted selection (70% unsolved, 30% solved)
- **Timer**: `useRef<setInterval>`, starts when grid becomes visible, continues on reset, stops on completion
- **Animations**: Single `requestAnimationFrame` loop with Set-based spiral order (memoized)
- **Memoization**: `React.memo` on GameCell with custom comparator, `useMemo` for border styles
- **Event delegation**: Single click handler on grid container (data-row/data-col attributes)
- **Real-time updates**: Firebase `onValue()` listeners for stats and presence tracking
- **Path alias**: `@/*` maps to `./src/*`

## Key Files for Common Tasks

- **Game rules/validation**: `src/lib/rules.ts` — pure functions, Map-based indexing
- **Game state/logic**: `src/hooks/useGameLogic.ts` — main hook for gameplay, victory detection, grid size persistence
- **Type definitions**: `src/types/game.ts` — all interfaces
- **Firebase integration**: `src/utils/levelStorage.ts` — levels, stats, presence, level weighting, real-time subscriptions
- **Statistics UI**: `src/components/GameStats.tsx` — online players (green dot), games won (discrete)
- **Leaderboard UI**: `src/components/Leaderboard.tsx` — Top 3 display only (read-only)
- **Victory UI**: `src/components/GameControls/SuccessMessage.tsx` — popup with leaderboard form
- **SEO**: `index.html`, `public/robots.txt`, `public/sitemap.xml`, `SEO_IMPROVEMENTS.md`
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

## Game Statistics & Progression

### Statistics System
- **Games Won Counter**: Real-time updates via Firebase `onValue()` listener
- **Online Players Counter**: Real-time presence tracking with automatic cleanup
- **UI**: Discrete header display with green animated dot for online count
- **Victory Detection**: Increments counter only when puzzle is solved (not on load/reset)
- **Cache Invalidation**: Automatic cache refresh on victory for instant updates
- **Anonymous Auth**: Required for Firebase write operations

### Level Weighting System
- **Smart Selection**: 70% chance for unsolved levels, 30% for solved levels
- **Progress Tracking**: Per-user solved levels stored in Firebase (`users/{uid}/solved_levels`)
- **Replay Support**: Solved levels remain available for practice
- **First-time Players**: 100% unsolved pool (all levels available)
- **All Solved**: Falls back to 100% solved pool (replay mode)

### Grid Size Persistence
- **localStorage Key**: `queens-game-grid-size`
- **Auto-load**: Last selected grid size loaded on app start (5-12)
- **Auto-save**: Grid size saved on change via `changeGridSizeOnly()`
- **Validation**: Size constrained to 5-12 range

### Leaderboard System
- **Storage**: Firebase Realtime Database (`leaderboards/grid_{size}`)
- **Top 3 only**: Reduces bandwidth by 70% vs top 10
- **Name-based updates**: Same player name = update if better time, prevents duplicates
- **Eligibility check**: Form shown in victory popup if time qualifies for top 3
- **Name persistence**: localStorage (`queens-game-player-name`) for auto-fill
- **Victory Flow**: Score submission only in SuccessMessage component
- **Display**: Leaderboard component is read-only (no form)
- **Client-side cache**: 30-second cache prevents excessive Firebase requests
- **Anonymous auth**: Required for write access (Firebase rules)

### Presence Tracking
- **Real-time Count**: Firebase `.info/connected` listener for connection state
- **Auto Cleanup**: `onDisconnect()` handlers remove stale presence data
- **Guard Protection**: Null reference guards prevent errors during reconnection
- **Auth Synchronization**: Wait for authentication before subscribing to presence

See `FIREBASE_SETUP.md` for rules configuration and `FIREBASE_MONITORING.md` for usage optimization.

## SEO Optimization (Feb 2026)

### Meta Tags & Structured Data
- **Title**: "Queens Game Online | Jeu de Puzzle Logique Gratuit & Illimité"
- **Description**: 155 chars with keywords (LinkedIn, gratuit, illimité, sans téléchargement)
- **Keywords**: 13 strategic terms (queens game, queens puzzle, linkedin queens, logic game, etc.)
- **Schema.org**: WebApplication + Game schemas with ratings, pricing, gameplay info
- **Open Graph**: Optimized for social sharing (Facebook, LinkedIn)
- **Twitter Cards**: Summary large image format

### Technical SEO
- **Canonical URL**: https://queens-game.creachtheo.fr
- **Robots.txt**: Proper crawling rules, sitemap reference
- **Sitemap.xml**: XML sitemap with priority and changefreq
- **Language**: French (fr-FR) with proper locale tags
- **Hidden Content**: SEO-friendly text (sr-only) with H1/H2/H3, keywords, rules
- **PWA**: Optimized manifest with description, UTM tracking

### Performance
- **Core Web Vitals**: Optimized for LCP, FID, CLS
- **Code Splitting**: Firebase and React as separate chunks
- **Lazy Loading**: Components loaded on demand
- **CDN**: Nginx + Traefik for fast delivery

See `SEO_IMPROVEMENTS.md` for detailed analysis and benchmarks.

## Environment

- `.env` for Firebase config (see `.env.example` for template)
- Docker: multi-stage build (node → nginx), `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod/GHCR)
- TypeScript strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- Firebase rules: See `firebase-rules.json` for production security configuration
