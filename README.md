# Queens Game Web

**Jeu de puzzle logique gratuit et illimité - Inspiré de LinkedIn Queens**

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/creach-t/queens-game-web/deploy.yml?style=for-the-badge&label=CI%2FCD)](https://github.com/creach-t/queens-game-web/actions)

**[🎮 Jouer maintenant](https://queens-game.creachtheo.fr)** | **[📖 Documentation](CLAUDE.md)** | **[🔍 SEO Guide](SEO_IMPROVEMENTS.md)**

---

## 🎯 Le Jeu

Puzzle logique addictif : placez exactement **une reine par ligne, colonne et région colorée**. Les reines ne peuvent pas se toucher (y compris en diagonale).

### ✨ Fonctionnalités

#### 🎮 Gameplay
- **Contrôles intuitifs** : Clic pour marquer (X), double-clic pour placer une reine (👑)
- **Slide tactile** : Marquer plusieurs cases d'un geste sur mobile
- **8 niveaux de difficulté** : De 5×5 (Tutoriel) à 12×12 (Mythique)
- **Timer intelligent** : Démarre automatiquement, continue sur reset
- **Règles complètes** : Popup détaillée avec objectifs, contrôles et astuces

#### 🏆 Progression & Classement
- **Leaderboard Top 3** : Par taille de grille, toujours visible
- **Sauvegarde automatique** : Formulaire uniquement si temps dans le Top 3
- **Nom mémorisé** : Auto-fill pour les prochaines victoires (localStorage)
- **Sélection intelligente** : 70% niveaux non-résolus, 30% résolus
- **Historique personnel** : Progression sauvegardée par utilisateur

#### 📊 Statistiques Temps Réel
- **Joueurs en ligne** : Compteur avec indicateur vert animé
- **Parties gagnées** : Total global en temps réel
- **Presence tracking** : Firebase avec cleanup automatique
- **Mises à jour instantanées** : Via Firebase listeners

#### 🎨 Interface Moderne
- **Design épuré** : Overlay-based avec contrôles flottants
- **Grille centrée** : Layout CSS Grid (3 colonnes) pour alignement parfait
- **Popup de victoire** : Message centré avec formulaire leaderboard
- **Mobile-first** : Interface adaptative, icônes compactes
- **Préférences sauvegardées** : Dernière taille de grille mémorisée

## 🚀 Installation

```bash
git clone https://github.com/creach-t/queens-game-web.git
cd queens-game-web
npm install
cp .env.example .env  # Configurer les variables Firebase
npm run dev
```

## 📝 Commandes

```bash
npm run dev          # Serveur de dev (localhost:3000)
npm run build        # Build production (dist/)
npm run preview      # Preview du build
npm run type-check   # Vérification TypeScript
```

## 🛠 Stack Technique

| Technologie | Usage |
|---|---|
| **React 18.2 + TypeScript 5.0** | Framework UI avec typage strict |
| **Vite 5.1** | Build tool ultra-rapide |
| **Tailwind CSS** | Utility-first CSS framework |
| **Lucide React** | Icônes modernes et cohérentes |
| **Firebase 11.9.1** | Realtime Database (niveaux, stats, presence) |
| **Docker + Nginx** | Conteneurisation et serveur web |
| **Traefik** | Reverse proxy avec TLS automatique |
| **GitHub Actions + GHCR** | CI/CD automatisé |

## 📁 Architecture

```
src/
├── components/
│   ├── Game.tsx                    # Orchestrateur principal
│   ├── GameCell.tsx                # Cellule individuelle (React.memo)
│   ├── GameStats.tsx               # Statistiques (joueurs, parties)
│   ├── Timer.tsx                   # Chronomètre
│   ├── Leaderboard.tsx             # Top 3 (read-only)
│   ├── GameBoard/
│   │   ├── index.tsx               # Wrapper plateau
│   │   ├── BoardGrid.tsx           # Grille (event delegation, touch)
│   │   ├── AnimationOverlay.tsx    # Animations CSS
│   │   └── LoadingState.tsx        # État chargement
│   └── GameControls/
│       ├── index.tsx               # Conteneur contrôles + board
│       ├── MainControls.tsx        # Reset / Nouveau (avec labels)
│       ├── Rules.tsx               # Règles détaillées (popup)
│       ├── SizeGridSelector.tsx    # Sélecteur difficulté
│       └── SuccessMessage.tsx      # Popup victoire + formulaire
├── hooks/
│   ├── useGameLogic.ts             # État jeu, timer, validation
│   └── useAnimations.ts            # Animations spirale
├── lib/
│   └── rules.ts                    # Validation pure (Map-based)
├── utils/
│   ├── levelStorage.ts             # Firebase (niveaux, stats, weighting)
│   ├── boardUtils.ts               # Utilitaires bordures
│   └── gameUtils.ts                # Init/reset plateau
├── types/
│   └── game.ts                     # Interfaces TypeScript
└── constants/
    └── index.ts                    # Palette couleurs (12 pastels)

public/
├── robots.txt                      # SEO: règles crawling
├── sitemap.xml                     # SEO: structure site
└── manifest.json                   # PWA optimisée
```

## ⚡ Optimisations Performances

### React & Rendering
- **Un seul `setGameState` par clic** : Validation synchrone, pas de double render
- **`React.memo` sur GameCell** : Comparateur custom, rerenders minimaux
- **Event delegation** : 1 handler grille au lieu de N² closures
- **Touch swipe optimisé** : `document.elementFromPoint` pour marquage fluide

### Firebase & Backend
- **Real-time listeners** : `onValue()` pour stats/presence (pas de polling)
- **Cache leaderboard 30s** : Réduit 90% bande passante
- **Top 3 uniquement** : 70% moins de données vs top 10
- **Eligibility pre-check** : Formulaire si temps qualifie seulement
- **Auth synchronization** : Évite permission errors
- **Presence cleanup guards** : Protection reconnexion

### Algorithmes
- **Validation Map-based** : O(Q+N) au lieu de O(Q×N)
- **`requestAnimationFrame`** : Animations smooth (vs 144 setTimeout)
- **Set-based spiral order** : Memoization pattern ordering
- **Cache invalidation intelligente** : Refresh auto sur victoire

### SEO & Performance Web
- **Code splitting** : Firebase + React chunks séparés
- **Lazy loading** : Composants chargés à la demande
- **Core Web Vitals** : Optimisé LCP, FID, CLS
- **Schema.org** : Rich snippets (WebApplication + Game)
- **Sitemap XML** : Indexation rapide par moteurs

## 🔄 CI/CD Pipeline

Pipeline automatique sur push vers `main` :

```
type-check → build → Docker image → GHCR → deploy VPS (zero-downtime)
```

### Workflow
1. **Type checking** : `tsc --noEmit`
2. **Build production** : Vite build optimisé
3. **Docker image** : Multi-stage (node → nginx)
4. **Push GHCR** : GitHub Container Registry
5. **Deploy VPS** : SSH + docker compose pull/restart
6. **Zero-downtime** : HEALTHCHECK + Traefik routing

## 🎚 Niveaux de Difficulté

| Taille | Nom | Difficulté |
|---|---|---|
| 5×5 | Tutoriel | ⭐ |
| 6×6 | Facile | ⭐⭐ |
| 7×7 | Normal | ⭐⭐⭐ |
| 8×8 | Difficile | ⭐⭐⭐⭐ |
| 9×9 | Expert | ⭐⭐⭐⭐⭐ |
| 10×10 | Maître | ⭐⭐⭐⭐⭐⭐ |
| 11×11 | Légendaire | ⭐⭐⭐⭐⭐⭐⭐ |
| 12×12 | Mythique | ⭐⭐⭐⭐⭐⭐⭐⭐ |

## 🔐 Configuration

### Variables d'environnement

Copier `.env.example` vers `.env` :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Firebase

- **Setup** : Voir `FIREBASE_SETUP.md` pour règles de sécurité
- **Monitoring** : Voir `FIREBASE_MONITORING.md` pour optimisation bande passante
- **Règles** : `firebase-rules.json` pour configuration production

## 🌐 SEO & Marketing

### Optimisations SEO (2026)
- **Title** : "Queens Game Online | Jeu de Puzzle Logique Gratuit & Illimité"
- **Meta description** : 155 chars avec keywords stratégiques
- **Schema.org** : WebApplication + Game schemas complets
- **Open Graph** : Partage social optimisé
- **Robots.txt** : Crawling rules configurées
- **Sitemap.xml** : Structure site pour indexation
- **Contenu caché** : SEO-friendly text (sr-only) avec H1/H2/H3

### Mots-clés ciblés
queens game, queens puzzle, linkedin queens, jeu de logique, puzzle en ligne, n-queens, chess puzzle, logic game, brain teaser, jeu gratuit, puzzle gratuit, jeu de réflexion, stratégie

Voir `SEO_IMPROVEMENTS.md` pour l'analyse complète et benchmarks concurrentiels.

## 🐳 Déploiement

### Dev local
```bash
docker-compose up -d
```

### Production (VPS)
```bash
# Fait automatiquement par CI/CD
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 📚 Documentation

- **CLAUDE.md** : Guide complet du projet pour IA
- **SEO_IMPROVEMENTS.md** : Stratégie SEO et analyse concurrentielle
- **FIREBASE_SETUP.md** : Configuration Firebase et règles de sécurité
- **FIREBASE_MONITORING.md** : Optimisation et monitoring Firebase

## 👤 Auteur

**Théo CREACH** — [@creach-t](https://github.com/creach-t)

Site web : [creachtheo.fr](https://creachtheo.fr)

## 📄 Licence

Projet sous licence MIT. Inspiré du Queens Game de LinkedIn.

---

**[🎮 Jouer maintenant](https://queens-game.creachtheo.fr)**
