# Rapport d'audit technique — Queens Game Web

**Date :** 2026-08-17
**Périmètre :** code source `src/`, configuration de build, documentation.
**Méthode :** lecture intégrale du code, `tsc --noEmit`, analyse d'écart doc↔code.

---

## 1. État général

Application **saine et fonctionnelle**. Le typage strict passe sans erreur
(`npm run type-check` ✅), l'architecture est claire (séparation UI / hooks / logique pure /
accès données), et les optimisations annoncées sont réellement présentes dans le code
(validation Map-based en O(Q+N), `React.memo` avec comparateur, animations
`requestAnimationFrame`, caches Firebase, présence temps réel).

Les problèmes relevés sont **mineurs à modérés** : essentiellement du code mort, des
dépendances inutilisées et des écarts de documentation. Aucun défaut bloquant.

| Indicateur              | État |
|-------------------------|------|
| `type-check` (strict)   | ✅ Passe |
| Architecture / lisibilité | ✅ Bonne |
| Sécurité                | 🟡 Correcte (voir §4) |
| Documentation ↔ code    | 🟠 Écarts corrigés (voir §5) |
| Dette technique         | 🟡 Code mort + deps inutilisées |

---

## 2. Forces

- **Séparation des responsabilités nette** : `lib/rules.ts` (pur, testable) isolé de l'état
  (`hooks/useGameLogic.ts`) et de l'accès données (`utils/levelStorage.ts`).
- **Un seul `setGameState` par interaction**, validation et détection de victoire synchrones
  dans le même callback → pas de rendu intermédiaire incohérent.
- **Robustesse StrictMode** : garde `hasIncrementedVictory` contre le double-montage React 18.
- **Gestion mémoire propre** : cleanup des timers, listeners Firebase, `requestAnimationFrame`
  et `onDisconnect()` de présence.
- **Interactions unifiées** clic / drag souris / swipe tactile bien factorisées dans `BoardGrid`.

---

## 3. Faiblesses & dette technique

### 3.1 Bug latent — cache de stats partagé
`levelStorage.ts` : `getTotalGamesPlayed()` et `getTotalGamesWon()` lisent/écrivent le
**même champ `statsCache`** (`{ totalGames, timestamp }`) alors qu'ils portent des compteurs
différents (`stats/total_games` vs `stats/total_games_won`). Si les deux étaient appelés dans
la même fenêtre de cache (60 s), l'un renverrait la valeur de l'autre.
*Impact réel actuel : faible* — seul le compteur « gagnées » est affiché, et via
`subscribeToGamesWon` (listener temps réel) qui n'utilise pas ce cache.
**Reco :** séparer en deux entrées de cache, ou supprimer les getters inutilisés (voir 3.2).

### 3.2 Code mort (non détecté par `tsc` car exporté)
| Fichier | Symbole | Statut |
|---|---|---|
| `lib/rules.ts` | `getHint`, `isPositionInBounds` | Jamais importés |
| `utils/gameUtils.ts` | `initializeBoard`, `positionToKey`, `formatPosition` | Jamais importés (`initializeBoard` duplique la logique inline de `convertToGameState`) |
| `utils/levelStorage.ts` | `getTotalGamesPlayed`, `incrementGamesPlayed`, `getTotalGamesWon` | Jamais appelés |
| `components/GameControls/index.tsx` | `handleGridClick` (no-op « gardé pour compatibilité ») | À retirer |
| `components/GameBoard/BoardGrid.tsx` | refs `isSwiping`, `isDragging` | Écrites, jamais lues |

`stats/total_games` n'est jamais incrémenté (`incrementGamesPlayed` mort) : la clé est donc
toujours vide en base.

### 3.3 Props mortes
`Leaderboard` reçoit `currentTime`, `isCompleted` et `onSaveScore` depuis `GameControls`
mais ne déstructure que `gridSize` et `formatTime` (composant read-only). Props à supprimer
de l'appelant et de l'interface.

### 3.4 Dépendances inutilisées (`package.json`)
Aucune occurrence dans `src/` de : `clsx`, `tailwind-merge`, `class-variance-authority`,
`@radix-ui/react-slot`, `tw-animate-css`, `dotenv`. `path` n'est utile qu'à `vite.config.ts`
(built-in Node, la dépendance npm est superflue). Vestiges d'un scaffolding shadcn/ui :
`components.json` orphelin (aucun `src/components/ui/`, aucune fonction `cn()`), et un
`import { Toaster }` commenté dans `App.tsx`.
**Reco :** `npm uninstall` de ces paquets + suppression de `components.json`.

### 3.5 Config Tailwind orpheline
Le projet utilise **Tailwind v4** (`@tailwindcss/vite` + `@import "tailwindcss"` dans
`index.css`). Le fichier `tailwind.config.js` est au **format v3** et n'est pas chargé par v4
en l'absence de directive `@config`. Les `keyframes`/`animation` `fade-in` qui y sont définis
sont donc **inertes**.
**Reco :** soit migrer ces tokens vers la config CSS v4 (`@theme`), soit ajouter `@config`,
soit supprimer le fichier s'il est vraiment inutile.

### 3.6 Typage faible dans la couche Firebase
`levelStorage.ts` : `db: any`, `auth: any` et plusieurs `as any` lors du parcours des niveaux.
Perte de garantie de type sur la donnée la plus critique.
**Reco :** typer avec `Database`/`Auth` de `firebase/*` et un type `RawStoredLevel`.

---

## 4. Sécurité

- **Clés Firebase exposées au build** (`VITE_FIREBASE_*`) : **normal et attendu** pour un
  client web Firebase — la sécurité repose sur les *Realtime Database Rules*
  (`firebase-rules.json`), pas sur le secret de la clé.
- **Auth anonyme** requise pour les écritures : correct.
- **Aucune donnée personnelle sensible** manipulée ; le `playerName` du leaderboard est saisi
  librement par l'utilisateur.
- **Point d'attention (hors code applicatif)** : vérifier que les règles Firebase valident
  bien la forme des écritures (`leaderboards`, `presence`, `solved_levels`) et bornent les
  tailles, pour éviter l'abus d'écriture depuis un client authentifié anonyme. Voir
  `FIREBASE_SETUP.md` / `firebase-rules.json`.

---

## 5. Écarts documentaires (corrigés lors de cet audit)

| # | Écart constaté | Correction appliquée |
|---|---|---|
| 1 | README : « Clic pour marquer, **double-clic** pour placer une reine » — inexistant dans le code | README réécrit : **clic simple en cycle** vide→❌→👑→vide |
| 2 | Drag **souris desktop** (commit `434a02d`) non documenté | Ajouté au README (« glisser-marquer souris **et** tactile ») |
| 3 | Tailwind présenté comme « utility-first » sans version, alors que **v4** | Badge + tableau stack mis à jour en **Tailwind CSS v4** |
| 4 | Commentaire code `getLeaderboard` : « top 10 » alors que `limitToFirst(3)` | Signalé (à corriger dans le commentaire de `levelStorage.ts:257`) |

**Livrables produits :**
- `docs/ARCHITECTURE.md` — cartographie + 3 diagrammes Mermaid (couches, cycle de clic,
  chargement de niveau) + modèle de données Firebase, aligné sur le code réel.
- `README.md` — corrections ci-dessus + liens vers la nouvelle documentation.
- `docs/AUDIT.md` — le présent rapport.

---

## 6. Plan d'action recommandé (par priorité)

1. **Corriger le commentaire « top 10 »** de `getLeaderboard` (`levelStorage.ts`). *(trivial)*
2. **Supprimer le code mort** listé en §3.2 et les props mortes §3.3. *(faible risque)*
3. **Désinstaller les dépendances inutilisées** §3.4 + supprimer `components.json`. *(allège le bundle/lockfile)*
4. **Décider du sort de `tailwind.config.js`** §3.5 (migrer vers `@theme` v4 ou supprimer).
5. **Dédoublonner/supprimer le cache de stats** §3.1 pour lever le bug latent.
6. **Typer la couche Firebase** §3.6 (amélioration continue).

> Aucune de ces actions n'est bloquante ; elles réduisent la surface de maintenance et
> alignent définitivement le dépôt sur son comportement réel.
