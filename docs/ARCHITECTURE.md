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
        GC["GameControls/index.tsx<br/>overlays + board + dock"]
        BOARD["GameBoard/index.tsx<br/>taille responsive"]
        GRID["BoardGrid.tsx<br/>clic / drag / swipe + surlignage indice"]
        CELL["GameCell.tsx<br/>(React.memo)"]
        STATS["GameStats.tsx"]
        LB["Leaderboard.tsx<br/>Top 3"]
        FULL["FullLeaderboard.tsx<br/>modale paginée 20/page"]
        SUCCESS["SuccessMessage.tsx<br/>résultat + rang"]
        MAIN["MainControls.tsx<br/>Indice / Effacer / Nouveau"]
        HINT["HintBanner.tsx<br/>explication par palier"]
        TIMER["Timer.tsx"]
    end

    subgraph State["État & logique"]
        HOOK["useGameLogic.ts<br/>GameState, timer, victoire, indice"]
        ANIM["useAnimations.ts<br/>spirale requestAnimationFrame"]
        RULES["lib/rules.ts<br/>validation + computeProgressiveHint (pur)"]
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
    GC --> FULL
    GC --> MAIN
    GC --> HINT
    GC --> SUCCESS
    GC --> TIMER
    BOARD --> ANIM
    HOOK --> RULES
    HOOK --> STORE
    GC --> STORE
    STATS --> STORE
    LB --> STORE
    FULL --> STORE
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

## Système d'indice progressif

`computeProgressiveHint` (pur, dans `lib/rules.ts`) renvoie un `ProgressiveHint` selon un
ordre de priorité pédagogique. `useGameLogic` gère le palier courant (`hintStage`), le
cooldown (interval unique par ref) et la pénalité de temps ; `HintBanner` affiche
l'explication et `BoardGrid` surligne les cases (interdites en rouge, cible en bleu).

```mermaid
flowchart TD
    START["showHint()"] --> ERR{"Erreur joueur ?<br/>croix sur case-reine<br/>ou reine hors-solution"}
    ERR -- oui --> RERR["Palier ERREUR (+5s)<br/>désigne la case fautive"]
    ERR -- non --> ELIM{"stage 0 ?<br/>zones interdites dispo ?"}
    ELIM -- oui --> RELIM["Palier ÉLIMINATION (+5s)<br/>cases interdites + loi expliquée"]
    ELIM -- non --> DED{"stage ≤ 1 ?<br/>une seule case possible ?"}
    DED -- oui --> RDED["Palier DÉDUCTION (+10s)<br/>case forcée en bleu"]
    DED -- non --> REV["Palier RÉVÉLATION (+15s)<br/>position de la reine (dernier recours)"]

    RELIM -. escalade .-> DED
    RDED -. escalade .-> REV
```

- **Escalade** : chaque appel monte d'un palier ; **réinitialisé quand `queensPlaced` change**.
- **Pénalité** croissante et **seulement si utilisé** ; **cooldown 10 s** (décompte tabulaire).

## Scores & classement

- `saveScore()` garde **une entrée par joueur** et renvoie un `SaveScoreResult`
  (`created | improved | unchanged | error` + `previousBestTime` + `rank` + `total`),
  consommé par `SuccessMessage` pour un feedback explicite.
- `getLeaderboardPage()` pagine le classement complet **par curseur**
  (`orderByChild("time")` + `startAfter`, 20/page) — jamais de lecture full-collection ;
  `FullLeaderboard` charge à la demande avec « Voir plus ».
- `Leaderboard` (Top 3, `limitToFirst(3)`, cache 30 s) reste l'aperçu, cliquable vers la modale.

## Modèle de données Firebase

| Chemin                                   | Contenu                                        |
|------------------------------------------|------------------------------------------------|
| `generated_levels_v1/{key}`              | `{ gridSize, complexity, regions, createdAt }` |
| `leaderboards/grid_{size}/{key}`         | `{ userId, playerName, time, timestamp, gridSize }` |
| `stats/total_games_won`                  | compteur global de victoires                   |
| `stats/total_games`                      | compteur de parties (⚠️ non alimenté, voir audit) |
| `users/{uid}/solved_levels/{levelKey}`   | `{ timestamp }`                                |
| `presence/users/{uid}`                   | `{ timestamp }` (+ `onDisconnect().remove()`)  |

## Contrôles réels (source : `BoardGrid.tsx` + `MainControls.tsx`)

- **Clic simple** : cycle `vide → marqué (❌) → reine (👑) → vide`. **Il n'y a pas de double-clic.**
- **Glisser-souris (desktop)** : marque en série les cellules vides traversées (`onMarkCell`).
- **Swipe tactile (mobile)** : idem au drag souris ; `touchAction: none` bloque le scroll.
- Un `tap` sans mouvement retombe sur le cycle de clic simple.
- **Dock d'actions** (`MainControls`) : **Indice / Effacer / Nouveau**, cibles ≥44px,
  `aria-label`, décompte de cooldown en chiffres tabulaires, `focus-visible` global.
- **Accessibilité** : `prefers-reduced-motion` (reset universel dans `index.css`),
  `touch-action: manipulation`, `aria-live` sur la bannière d'indice.

## Décisions d'architecture notables

- **Pas de state manager externe** : `useState` + `useCallback` dans des hooks custom.
- **`levelStorage` = singleton** instancié au chargement du module avec la config Firebase.
- **Mémoïsation** : `React.memo` (comparateur custom sur `GameCell`), `useMemo` pour
  styles de bordure et ordre spirale.
- **Délégation d'événements** : handlers souris/tactile posés sur le conteneur de grille,
  résolution de cellule via `data-row`/`data-col` + `document.elementFromPoint`.
- **Caches côté client** : leaderboard 30 s, stats 60 s (voir réserve dans l'audit).
