# Configuration Firebase pour Queens Game Web

## Règles de sécurité Firebase Realtime Database

Pour activer le système de leaderboard, vous devez configurer les règles Firebase dans la console Firebase.

### Étapes de configuration

1. **Accédez à la console Firebase** : https://console.firebase.google.com/
2. **Sélectionnez votre projet** : `queens-game-web` (ou le nom de votre projet)
3. **Naviguez vers Realtime Database** : Menu latéral → Build → Realtime Database
4. **Cliquez sur l'onglet "Règles"**
5. **Remplacez les règles existantes** par le contenu du fichier `firebase-rules.json`

### Règles Firebase (firebase-rules.json)

```json
{
  "rules": {
    "generated_levels_v1": {
      ".read": true,
      ".write": false
    },
    "leaderboards": {
      "$gridSize": {
        ".read": true,
        ".write": "auth != null",
        "$scoreId": {
          ".validate": "newData.hasChildren(['userId', 'playerName', 'time', 'timestamp', 'gridSize']) && newData.child('userId').val() === auth.uid && newData.child('playerName').isString() && newData.child('playerName').val().length > 0 && newData.child('playerName').val().length <= 20 && newData.child('time').isNumber() && newData.child('timestamp').isNumber() && newData.child('gridSize').isNumber()"
        }
      }
    }
  }
}
```

### Explication des règles

#### `generated_levels_v1`
- **Lecture** : Tous les utilisateurs peuvent lire les niveaux
- **Écriture** : Personne ne peut écrire (sécurité des niveaux)

#### `leaderboards`
- **Lecture** : Tous les utilisateurs peuvent lire les scores
- **Écriture** : Seuls les utilisateurs authentifiés peuvent écrire
- **Validation** :
  - Le score doit contenir tous les champs requis : `userId`, `playerName`, `time`, `timestamp`, `gridSize`
  - `userId` doit correspondre à l'utilisateur connecté (empêche de sauvegarder un score pour quelqu'un d'autre)
  - `playerName` doit être une chaîne entre 1 et 20 caractères
  - `time`, `timestamp`, `gridSize` doivent être des nombres

### Structure des données

```
leaderboards/
  grid_5/
    -NxxxxxxxxxxxX: {
      userId: "abc123...",
      playerName: "Alice",
      time: 120,
      timestamp: 1234567890,
      gridSize: 5
    }
  grid_6/
    -NyyyyyyyyyyyY: {
      userId: "def456...",
      playerName: "Bob",
      time: 95,
      timestamp: 1234567891,
      gridSize: 6
    }
  ...
  grid_12/
```

### Authentification anonyme

Le système utilise l'authentification anonyme Firebase. Assurez-vous que :

1. **Authentication est activée** : Menu latéral → Build → Authentication
2. **Méthode anonyme activée** : Onglet "Sign-in method" → Anonymous → Activer

### Test des règles

Vous pouvez tester les règles directement dans la console Firebase :

1. Allez dans l'onglet "Règles" de Realtime Database
2. Cliquez sur "Simulateur de règles"
3. Testez les opérations read/write

Exemples de tests :
- **Lecture** : `leaderboards/grid_6` → Devrait réussir
- **Écriture (non authentifié)** : `leaderboards/grid_6/test` → Devrait échouer
- **Écriture (authentifié)** : Avec simulation d'auth → Devrait réussir

### Déploiement des règles

Après avoir sauvegardé les règles dans la console Firebase, elles sont actives immédiatement. Aucun redémarrage n'est nécessaire.

### Dépannage

Si vous rencontrez l'erreur `PERMISSION_DENIED` :

1. Vérifiez que les règles sont bien déployées dans la console Firebase
2. Vérifiez que l'authentification anonyme est activée
3. Vérifiez que l'utilisateur est bien authentifié (console DevTools → Application → IndexedDB → firebaseLocalStorage)
4. Testez dans le simulateur de règles Firebase

### Note de sécurité

Ces règles permettent :
- ✅ Lecture publique des leaderboards (transparence des scores)
- ✅ Écriture uniquement pour les utilisateurs authentifiés
- ✅ Validation stricte des données (prévient les données malformées)
- ✅ Protection contre l'usurpation (userId doit correspondre à l'auth)
- ❌ Pas de suppression ou modification des scores existants

Pour plus de sécurité, vous pourriez ajouter des règles de rate limiting ou de suppression après un certain temps.
