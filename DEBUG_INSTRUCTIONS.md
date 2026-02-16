# Instructions de débogage

## Problèmes identifiés et fixes

### ✅ RÉSOLU: Compteur de victoires ne se met pas à jour

**Cause:** Cache de 60 secondes + polling au lieu de temps réel

**Fix appliqué:**
- Ajout de `subscribeToGamesWon()` pour écoute temps réel via `onValue()`
- Invalidation du cache lors de `incrementGamesWon()`
- Commit: `b32d01a`

---

### ⚠️ EN COURS: Joueurs en ligne non visibles

**Causes possibles:**

1. **Règles Firebase non déployées** (le plus probable)
   - Les règles pour `presence/users` sont dans `firebase-rules.json`
   - Mais elles ne sont pas déployées sur Firebase

2. **Authentification Firebase**
   - L'auth anonyme doit réussir avant de pouvoir écrire dans `presence/`

3. **Erreurs console**
   - Des erreurs Firebase peuvent bloquer silencieusement

---

## Comment déboguer

### Étape 1: Déployer les règles Firebase

**Option A: Console Firebase (le plus simple)**

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet
3. Menu **Realtime Database** → **Règles**
4. Copiez le contenu de `firebase-rules.json` dans l'éditeur
5. Cliquez sur **Publier**

**Option B: Firebase CLI**

```bash
# Installer Firebase CLI (si pas déjà fait)
npm install -g firebase-tools

# Se connecter
firebase login

# Déployer uniquement les règles
firebase deploy --only database
```

---

### Étape 2: Vérifier dans la console du navigateur

Ouvrez http://localhost:3001 et ouvrez la console (F12), recherchez:

**Logs de présence (devrait apparaître):**
```
[Presence] Utilisateur marqué en ligne
```

**Erreurs possibles:**
```
[Presence] Firebase non disponible
[Presence] Utilisateur non authentifié
PERMISSION_DENIED: Permission denied
```

---

### Étape 3: Vérifier dans Firebase Console

1. Allez dans **Realtime Database** → **Données**
2. Vérifiez si le nœud `presence/users/` existe
3. Vérifiez si votre UID est présent avec un timestamp

**Structure attendue:**
```
presence/
  users/
    {votre-user-id}/
      timestamp: 1708095432000
```

---

### Étape 4: Vérifier les stats

De même, vérifiez:
```
stats/
  total_games_won: 0  (ou un nombre)
```

Si `total_games_won` n'existe pas, résolvez un puzzle pour le créer.

---

## Tests à faire après déploiement des règles

1. **Rafraîchir la page** (Ctrl+R)
2. **Vérifier la console** pour voir `[Presence] Utilisateur marqué en ligne`
3. **Ouvrir un 2ème onglet** → le compteur devrait passer à "2 joueurs en ligne"
4. **Résoudre un puzzle** → le compteur de victoires devrait s'incrémenter instantanément
5. **Fermer un onglet** → le compteur devrait descendre après 30-60s

---

## Logs utiles pour diagnostic

Si les joueurs en ligne ne s'affichent toujours pas, vérifiez ces logs:

**Dans GameStats.tsx:**
- Rien ne s'affiche si `onlineCount === null` ou `onlineCount === 0`

**Dans levelStorage.ts:**
- `[Presence] Firebase non disponible` → problème d'init Firebase
- `[Presence] Utilisateur non authentifié` → auth anonyme a échoué
- Pas de log du tout → `startPresenceTracking()` n'est pas appelé

**Dans la console Firebase:**
- `PERMISSION_DENIED` → règles pas déployées ou mauvaises

---

## Ordre de débogage recommandé

1. ✅ **Déployer les règles Firebase** (Option A Console est + simple)
2. ✅ **Rafraîchir la page** et ouvrir la console navigateur
3. ✅ **Chercher les logs `[Presence]`** pour identifier le problème
4. ✅ **Vérifier Firebase Console** → Données → presence/users/
5. ✅ **Résoudre un puzzle** pour tester le compteur de victoires

---

## Notes importantes

- **Les compteurs n'apparaissent que si > 0**
  - Si `onlineCount === 0`, le badge vert ne s'affiche pas
  - Si `totalGames === 0`, le badge gris ne s'affiche pas

- **Délai de déconnexion: 30-60 secondes**
  - Firebase met 30-60s pour détecter une déconnexion
  - Normal que le compteur ne baisse pas immédiatement

- **Plusieurs onglets = plusieurs sessions**
  - Chaque onglet compte comme un joueur distinct
  - C'est le comportement attendu (pas un bug)
