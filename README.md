# Queens Game Web

**Version web responsive du puzzle Queens de LinkedIn**

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/creach-t/queens-game-web/deploy.yml?style=for-the-badge&label=CI%2FCD)](https://github.com/creach-t/queens-game-web/actions)

**[Jouer maintenant](https://queens-game.creachtheo.fr)**

## Le jeu

Puzzle logique : placez exactement une reine par ligne, colonne et region coloree. Les reines ne peuvent pas se toucher (y compris en diagonale).

- **Tap** : cycle vide → marqueur → reine → vide
- **Slide tactile** : marquer plusieurs cases d'un geste
- **Grilles** : 5×5 (Tutoriel) a 12×12 (Mythique)
- **Timer** : demarre des l'affichage, continue sur reset
- **Leaderboard** : top 3 par taille de grille, visible immediatement
- **Save intelligente** : formulaire uniquement si top 3 eligible, nom memorise comme placeholder

## Installation

```bash
git clone https://github.com/creach-t/queens-game-web.git
cd queens-game-web
npm install
cp .env.example .env  # Configurer les variables Firebase
npm run dev
```

## Commandes

```bash
npm run dev          # Serveur de dev (localhost:3000)
npm run build        # Build production (dist/)
npm run preview      # Preview du build
npm run type-check   # Verification TypeScript
```

## Stack technique

| Technologie | Usage |
|---|---|
| React 18.2 + TypeScript 5.0 | Framework UI |
| Vite 5.1 | Build tool |
| Tailwind CSS | Styling |
| Lucide React | Icones |
| Firebase 11.9.1 | Base de donnees (niveaux + leaderboard) |
| Docker + Nginx | Deploiement |
| Traefik | Reverse proxy + TLS |
| GitHub Actions + GHCR | CI/CD |

## Architecture

```
src/
├── components/          # Composants React
│   ├── Game.tsx         # Orchestrateur principal
│   ├── GameCell.tsx     # Cellule (React.memo)
│   ├── Timer.tsx        # Chronometre
│   ├── Leaderboard.tsx  # Top 3 + save form (eligibility check)
│   ├── GameBoard/       # Plateau (event delegation, touch swipe)
│   └── GameControls/    # Controles (reset, nouveau jeu, difficulte)
├── hooks/
│   ├── useGameLogic.ts  # Etat du jeu, timer, validation synchrone, save
│   └── useAnimations.ts # Animations spirale (requestAnimationFrame)
├── lib/
│   └── rules.ts         # Validation pure (Map-based, O(N))
├── utils/
│   ├── levelStorage.ts  # Firebase (niveaux + leaderboard avec cache 30s)
│   ├── boardUtils.ts    # Styles de bordure
│   └── gameUtils.ts     # Init/reset du plateau
└── types/
    └── game.ts          # Interfaces TypeScript
```

### Optimisations performances

- **Un seul `setGameState` par clic** (plus de double render via setTimeout)
- **`React.memo`** sur GameCell avec comparateur custom
- **Event delegation** : 1 handler sur la grille au lieu de N² closures
- **Validation Map-based** : O(Q+N) au lieu de O(Q×N)
- **`requestAnimationFrame`** pour les animations (au lieu de 144 setTimeout)
- **Touch swipe** avec `document.elementFromPoint` pour marquer en glissant
- **Cache leaderboard 30s** : evite requetes Firebase repetees (reduit 90% bande passante)
- **Top 3 uniquement** : 70% moins de donnees vs top 10
- **Eligibility pre-check** : formulaire save uniquement si temps qualifie

## CI/CD

Pipeline automatique sur push vers `main` :

```
type-check → build → Docker image → GHCR → deploy VPS (zero-downtime)
```

Le zero-downtime est assure par le HEALTHCHECK Docker + Traefik qui route automatiquement vers le nouveau conteneur une fois qu'il est pret.

### Deploiement

**Dev local** : `docker-compose.yml` (build local)
**Production** : `docker-compose.prod.yml` (image GHCR)

```bash
# Sur le VPS (fait automatiquement par le CI)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Niveaux de difficulte

| Taille | Difficulte |
|---|---|
| 5×5 | Tutoriel |
| 6×6 | Facile |
| 7×7 | Normal |
| 8×8 | Difficile |
| 9×9 | Expert |
| 10×10 | Maitre |
| 11×11 | Legendaire |
| 12×12 | Mythique |

## Environnement

Copier `.env.example` vers `.env` et remplir les variables Firebase :

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

**Configuration Firebase** : voir `FIREBASE_SETUP.md` pour les regles de securite et `FIREBASE_MONITORING.md` pour l'optimisation de la bande passante.

## Auteur

**CREACH-T** — [@creach-t](https://github.com/creach-t)

Inspire du Queens Game de LinkedIn. Licence MIT.
