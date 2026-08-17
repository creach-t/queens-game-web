# Roadmap — Queens Game Web

> Améliorations produit issues du retour utilisateur (2026-08-17).
> Statut : `💡 idée` · `🔜 à faire` · `🚧 en cours` · `✅ fait`.

---

## 1. 🔜 Marquage rapide des croix — meilleure ergonomie desktop

**Retour :** sur desktop, le système pour poser rapidement les croix (❌) devrait être
mieux géré.

**Existant (`BoardGrid.tsx`) :** le clic gauche fait un cycle complet
`vide → ❌ → 👑 → vide`, et le glisser-souris marque en série les cases vides. Poser
plusieurs croix « à la volée » reste donc peu direct au clavier/souris.

**Pistes :**
- **Clic droit = poser/retirer une croix** directement (raccourci dédié, sans passer par
  le cycle), clic gauche réservé à la reine 👑.
- **Glisser-souris intelligent** : verrouiller l'action du drag sur l'état de la 1ʳᵉ case
  (tout marquer / tout effacer) au lieu de ne marquer que les cases vides.
- Option **maintien d'une touche** (ex. `Shift`) pendant le clic/drag pour forcer le mode
  croix.
- Empêcher le menu contextuel natif (`onContextMenu` → `preventDefault`) si clic droit utilisé.

**Notes :** conserver la parité tactile (mobile n'a pas de clic droit → garder le swipe).

---

## 2. 🔜 Bouton d'indice avec pénalité temporelle

**Retour :** ajouter un bouton d'**indice relançable toutes les X secondes**, qui **ajoute
des secondes au timer** — de façon à ne pas pénaliser les joueurs qui ne l'utilisent pas.

**Design proposé :**
- Réutiliser `getHint(board, solution)` **déjà présent** dans `lib/rules.ts` (actuellement
  code mort) : il renvoie la prochaine position de reine correcte non encore placée.
- **Cooldown** de X secondes entre deux indices (bouton désactivé + décompte visible).
- **Pénalité** : +N secondes ajoutées au `gameTime` à chaque indice utilisé (ex. +30 s),
  au lieu d'un malus fixe qui s'appliquerait à tous.
- Feedback visuel : surligner brièvement la case suggérée (réutiliser `isHighlighted`,
  déjà dans le type `GameCell`).

**À trancher :** valeurs de X (cooldown) et N (pénalité) ; comportement si le joueur a
placé des reines erronées (indice sur la prochaine case de `solution` restante).

**Impacts :** `useGameLogic` (exposer un `useHint()` + malus timer), UI d'un bouton
« Indice » dans `MainControls`.

---

## 3. ✅ Enregistrement des scores plus clair + leaderboard complet

**Retour :** le système d'enregistrement n'est pas très clair. On voudrait :
enregistrer **chaque score**, **afficher le rang** du joueur, et pouvoir **cliquer sur le
Top 3 pour voir le leaderboard complet**. ⚠️ **Attention à ne pas saturer le stockage.**

**Existant :** `leaderboards/grid_{size}` stocke une entrée **par nom** (mise à jour si
meilleur temps), et l'affichage se limite au **Top 3** (`limitToFirst(3)`). Choix motivé
par la bande passante Firebase (voir `FIREBASE_MONITORING.md`).

**Décision (arbitrage tranché) :** on garde **une entrée par joueur** (borné naturellement,
pas de risque de saturation). L'effort porte donc sur la **clarté du feedback**, aujourd'hui
opaque : `saveScore` renvoie juste `true`/`false` sans expliquer pourquoi.

**Objectifs UX — messages explicites selon l'état :**
- **Nouveau joueur** → « Score enregistré 🎉 — vous êtes **N-ᵉ** sur M. »
- **Déjà enregistré, meilleur temps** → « Nouveau record perso ! **02:14 → 01:58**, vous
  passez **N-ᵉ**. »
- **Déjà enregistré, temps égal ou moins bon** → « Votre meilleur temps reste **01:58**
  (ce run : 02:14). Rien à enregistrer. » *(état actuellement silencieux : `saveScore`
  retourne `false` sans rien dire → à rendre visible)*
- Toujours afficher le **rang** du joueur, même quand rien n'est enregistré.
- Le Top 3 affiché reste le résumé ; **clic → modale leaderboard complet** (paginé).

**Impacts :** faire remonter un **résultat riche** de `saveScore` (enum
`created | improved | unchanged` + ancien/nouveau temps + rang) au lieu d'un simple booléen,
puis adapter `SuccessMessage`.

**✅ Livré (voir commit dédié) :**
- `saveScore` renvoie `SaveScoreResult` (`status` + `previousBestTime` + `rank` + `total`).
- `SuccessMessage` affiche les 3 messages explicites (nouveau / record amélioré / inchangé)
  avec le rang ; le formulaire n'est plus conditionné au Top 3 (chaque score est enregistré).
- Nouveau composant `FullLeaderboard` : modale paginée 20/page, « Voir plus » par curseur
  (`getLeaderboardPage` via `orderByChild("time")` + `startAfter`), surlignage du joueur courant.
- Bouton « Voir le classement complet » dans `Leaderboard` (desktop + popup mobile).
- Nettoyage au passage : suppression de `canEnterLeaderboard` (devenue inutile) et des props
  mortes de `Leaderboard` (**T3**), correction du commentaire « top 10 » (**T1**).
- Vérifié : `type-check` ✅, `build` ✅, test navigateur contre Firebase réel ✅ (rangs corrects).

**⚠️ Garde-fous stockage / bande passante (à respecter absolument) :**
- **Ne pas** stocker une entrée par partie sans borne : privilégier **une entrée par
  joueur** (comportement actuel `saveScore`) pour éviter la croissance illimitée.
- Si l'on veut vraiment l'historique de chaque score : **capper** (ex. garder les N
  meilleurs par grille via une Cloud Function / règle, ou purge périodique) et **ne jamais
  lire toute la collection côté client**.
- **Rang** : le calculer sans télécharger toutes les entrées — p. ex.
  `orderByChild("time")` + `endBefore(monTemps)` + `get()` sur les **clés seules** pour un
  `count`, ou maintenir un index agrégé. Éviter un `get()` full-collection à chaque victoire.
- **Leaderboard complet** : chargement **à la demande** (au clic uniquement) + **pagination**
  (`limitToFirst` par pages) + cache client (le cache 30 s existe déjà dans `levelStorage`).
- Réévaluer les **règles Firebase** (`firebase-rules.json`) : valider forme et taille des
  écritures, borner le nombre d'entrées par grille.

**Décidé :** leaderboard complet paginé à **20 entrées/page**, chargement « voir plus »
(curseur `orderByChild("time")` + `startAfter`, une page à la fois — pas de lecture full-collection).

---

## 4. 🔜 Dette technique & nettoyage (issu de l'audit)

Source : **[docs/AUDIT.md](AUDIT.md)** §6. Aucun de ces points n'est bloquant ; ils réduisent
la surface de maintenance et alignent le dépôt sur son comportement réel.

| # | Action | Fichier(s) | Effort | Risque |
|---|---|---|---|---|
| T1 | ✅ **Fait** — commentaire « top 10 » corrigé en « top 3 » | `utils/levelStorage.ts` | Trivial | Nul |
| T2 | Supprimer le **code mort** : `getHint`\*, `isPositionInBounds`, `initializeBoard`, `positionToKey`, `formatPosition`, `getTotalGamesPlayed`, `incrementGamesPlayed`, `getTotalGamesWon`, `handleGridClick` (no-op), refs `isSwiping`/`isDragging` | `lib/rules.ts`, `utils/gameUtils.ts`, `utils/levelStorage.ts`, `components/GameControls/index.tsx`, `components/GameBoard/BoardGrid.tsx` | Faible | Faible |
| T3 | ✅ **Fait** — props mortes `currentTime`/`isCompleted`/`onSaveScore` retirées de `Leaderboard` | `components/Leaderboard.tsx`, `components/GameControls/index.tsx` | Faible | Faible |
| T4 | Désinstaller les **deps inutilisées** : `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`, `tw-animate-css`, `dotenv`, `path` ; supprimer `components.json` orphelin + l'import `Toaster` commenté | `package.json`, `App.tsx` | Faible | Faible |
| T5 | **Config Tailwind orpheline** : `tailwind.config.js` (format v3) n'est pas chargé par v4 → migrer les keyframes `fade-in` vers `@theme` (CSS v4), ajouter `@config`, ou supprimer | `tailwind.config.js`, `index.css` | Faible | Moyen (vérifier animations) |
| T6 | **Bug latent** : `getTotalGamesPlayed` et `getTotalGamesWon` partagent le même `statsCache` → dédoublonner le cache (ou supprimer les getters via T2) | `utils/levelStorage.ts` | Faible | Faible |
| T7 | **Typer la couche Firebase** : remplacer `db: any`/`auth: any` et les `as any` par `Database`/`Auth` + un type `RawStoredLevel` | `utils/levelStorage.ts` | Moyen | Faible |

\* **Exception `getHint`** : ne pas supprimer — il est **réutilisé par la feature indice (§2)**.
À conserver, contrairement aux autres symboles morts.

> ⚠️ `stats/total_games` n'est jamais incrémenté (`incrementGamesPlayed` mort) : la clé
> reste vide en base. À supprimer, ou à alimenter si un compteur « parties jouées » est voulu.

---

## Priorisation suggérée

**Features (retour utilisateur) :**

| Ordre | Item | Effort | Dépendances |
|---|---|---|---|
| 1 | Bouton d'indice (§2) | Faible | `getHint` déjà écrit |
| 2 | Marquage desktop clic droit (§1) | Faible/Moyen | `BoardGrid` |
| 3 | Rang + leaderboard complet (§3) | Moyen | Règles Firebase + pagination |

**Technique (§4) :** T1 → T4 sont des « quick wins » à faire en premier (nettoyage sans
risque). T5/T6/T7 ensuite. Idéalement **faire T2/T4 avant** de démarrer les features pour
partir d'une base propre — sauf `getHint`, gardé pour la feature indice.

> Rappel transverse : toute évolution touchant Firebase doit passer la revue
> `FIREBASE_MONITORING.md` (bande passante) avant déploiement.
