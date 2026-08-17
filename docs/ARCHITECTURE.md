# Architecture — Queens Game Web

> Document synchronisé avec le code source réel (voir `src/`).
> Dernière vérification : audit du 2026-08-17.

Queens Game Web est une SPA React sans backend applicatif : toute la logique de jeu
s'exécute côté client, et **Firebase Realtime Database** sert uniquement de couche de
persistance (niveaux, scores, statistiques, présence). Il n'y a **aucune génération de
niveau côté client** — les grilles sont lues depuis Firebase.

## Vue d'ensemble des couches

```mermaid
flowchart TD
    subgraph Entry["Points d'entrée"]
        HTML["index.html"]
        MAIN["main.tsx<br/>(ReactDOM.createRoot)"]
        APP["App.tsx<br/>(header, SEO sr-only, footer)"]
    end

    subgraph UI["Couche UI (composants React)"]
        GAME["Game.tsx<br/>orchestrateur"]
        GC["GameControls/index.tsx<br/>overlays + board"]
        BOARD["GameBoard/index.tsx<br/>taille responsive"]
        GRID["BoardGrid.tsx<br/>clic / drag souris / swipe tactile"]
        CELL["GameCell.tsx<br/>(React.memo)"]
        STATS["GameStats.tsx"]
        LB["Leaderboard.tsx"]
        SUCCESS["SuccessMessage.tsx"]
        TIMER["Timer.tsx"]
    end

    subgraph State["État & logique"]
        HOOK["useGameLogic.ts<br/>GameState, timer, victoire"]
        ANIM["useAnimations.ts<br/>spirale requestAnimationFrame"]
        RULES["lib/rules.ts<br/>validation pure (Map O(Q+N))"]
    end

    subgraph Data["Accès données"]
        STORE["utils/levelStorage.ts<br/>singleton LevelStorage"]
        CONST["constants (palette couleurs)"]
    end

    subgraph Backend["Firebase"]
        FB[("Realtime Database<br/>+ Auth anonyme")]
    end

    HTML --> MAIN --> APP
    APP --> GAME
    APP --> STATS
    GAME --> HOOK
    GAME --> GC
    GC --> BOARD --> GRID --> CELL
    GC --> LB
    GC --> SUCCESS
    GC --> TIMER
    BOARD --> ANIM
    HOOK --> RULES
    HOOK --> STORE
    GC --> STORE
    STATS --> STORE
    LB --> STORE
    SUCCESS --> STORE
    STORE --> FB
    STORE --> CONST
```

## Cycle de vie d'un clic sur une cellule

Un clic déclenche **un seul `setGameState`** ; validation des conflits et détection de
victoire sont synchrones dans le même callback (pas de `setTimeout` différé).

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant BG as BoardGrid
    participant H as useGameLogic
    participant R as rules.ts
    participant FB as Firebase

    U->>BG: mousedown/mouseup (ou touch)
    BG->>H: onCellClick(row, col)
    Note over H: cycle état<br/>empty → marked → queen → empty
    H->>H: recompte reines + régions (1 passe)
    H->>R: updateConflicts(board, regions)
    R-->>H: board avec flags de conflit
    alt reines placées == gridSize
        H->>R: validateCompleteGameState(queens, regions, size)
        R-->>H: { isValid }
    end
    H-->>BG: nouveau GameState (isCompleted?)
    opt victoire (une seule fois, guard StrictMode)
        H->>FB: incrementGamesWon()
        H->>FB: markLevelAsSolved(levelKey)
    end
```

## Chargement d'un niveau

```mermaid
sequenceDiagram
    participant H as useGameLogic
    participant S as levelStorage
    participant FB as Firebase

    H->>S: getRandomLevel(gridSize)
    S->>FB: waitForAuth() (anonyme)
    S->>FB: get("generated_levels_v1")
    FB-->>S: tous les niveaux
    S->>FB: getSolvedLevels() (users/{uid}/solved_levels)
    Note over S: pondération 70% non-résolus / 30% résolus
    S-->>H: StoredLevel
    H->>S: convertToGameState(storedLevel)
    S-->>H: GameState (board + regions + solution)
```

## Modèle de données Firebase

| Chemin                                   | Contenu                                        |
|------------------------------------------|------------------------------------------------|
| `generated_levels_v1/{key}`              | `{ gridSize, complexity, regions, createdAt }` |
| `leaderboards/grid_{size}/{key}`         | `{ userId, playerName, time, timestamp, gridSize }` |
| `stats/total_games_won`                  | compteur global de victoires                   |
| `stats/total_games`                      | compteur de parties (⚠️ non alimenté, voir audit) |
| `users/{uid}/solved_levels/{levelKey}`   | `{ timestamp }`                                |
| `presence/users/{uid}`                   | `{ timestamp }` (+ `onDisconnect().remove()`)  |

## Contrôles réels (source : `BoardGrid.tsx`)

- **Clic simple** : cycle `vide → marqué (❌) → reine (👑) → vide`. **Il n'y a pas de double-clic.**
- **Glisser-souris (desktop)** : marque en série les cellules vides traversées (`onMarkCell`).
- **Swipe tactile (mobile)** : idem au drag souris ; `touchAction: none` bloque le scroll.
- Un `tap` sans mouvement retombe sur le cycle de clic simple.

## Décisions d'architecture notables

- **Pas de state manager externe** : `useState` + `useCallback` dans des hooks custom.
- **`levelStorage` = singleton** instancié au chargement du module avec la config Firebase.
- **Mémoïsation** : `React.memo` (comparateur custom sur `GameCell`), `useMemo` pour
  styles de bordure et ordre spirale.
- **Délégation d'événements** : handlers souris/tactile posés sur le conteneur de grille,
  résolution de cellule via `data-row`/`data-col` + `document.elementFromPoint`.
- **Caches côté client** : leaderboard 30 s, stats 60 s (voir réserve dans l'audit).
