# Firebase Rules Update - Game Statistics & Online Presence

## Nouvelles règles ajoutées

Les règles Firebase ont été mises à jour pour supporter :
1. Le compteur de parties jouées
2. Le suivi de présence en temps réel (joueurs en ligne)

### Nouveaux nœuds dans la base de données

**Statistiques globales :**
```json
"stats": {
  "total_games": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

**Suivi de présence :**
```json
"presence": {
  "users": {
    "$uid": {
      ".read": true,
      ".write": "$uid === auth.uid",
      ".validate": "newData.hasChildren(['timestamp']) && newData.child('timestamp').isNumber()"
    }
  }
}
```

## Comment déployer les nouvelles règles

### Option 1 : Manuellement via la console Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner votre projet
3. Aller dans **Realtime Database** → **Règles**
4. Copier le contenu de `firebase-rules.json` dans l'éditeur
5. Cliquer sur **Publier**

### Option 2 : Via Firebase CLI

```bash
# Installer Firebase CLI si nécessaire
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Déployer les règles
firebase deploy --only database
```

## Structure de la base de données

Après le déploiement, la base de données aura cette structure :

```
queens-game-db/
├── generated_levels_v1/      (lecture seule)
├── leaderboards/
│   └── grid_{size}/          (lecture publique, écriture authentifiée)
├── stats/
│   └── total_games           (lecture publique, écriture authentifiée)
└── presence/
    └── users/
        └── {userId}          (lecture publique, écriture propriétaire uniquement)
            └── timestamp
```

## Comportement

### Statistiques globales
- **Lecture** : Accessible à tous (même sans authentification)
- **Écriture** : Nécessite une authentification anonyme
- Le compteur est incrémenté automatiquement à chaque nouvelle partie chargée
- Le cache côté client (1 minute) réduit la charge sur Firebase

### Suivi de présence
- **Lecture** : Accessible à tous (permet d'afficher le compteur de joueurs en ligne)
- **Écriture** : Chaque utilisateur ne peut écrire que sa propre entrée de présence
- **Validation** : Requiert un champ `timestamp` de type numérique
- **Nettoyage automatique** : Firebase supprime l'entrée via `onDisconnect()` quand l'utilisateur se déconnecte
- **Temps réel** : Les mises à jour sont propagées instantanément à tous les clients connectés
- **Impact bande passante** : ~8 MB/mois supplémentaires pour 1000 utilisateurs actifs

### Fonctionnement du suivi de présence

1. **Connexion** : Lorsqu'un utilisateur charge l'application
   - Le client s'authentifie anonymement
   - Crée une entrée dans `presence/users/{uid}` avec timestamp actuel
   - Configure `onDisconnect()` pour supprimer l'entrée automatiquement

2. **Écoute en temps réel** : Tous les clients écoutent `presence/users`
   - Comptent le nombre d'entrées présentes
   - Affichent "X joueur(s) en ligne" dans le header

3. **Déconnexion** : Lorsqu'un utilisateur quitte
   - Firebase détecte la perte de connexion (30-60s)
   - `onDisconnect()` supprime automatiquement l'entrée
   - Le compteur se met à jour pour tous les clients

4. **Cas particuliers**
   - **Plusieurs onglets** : Chaque onglet compte comme une session distincte
   - **Réseau instable** : Firebase gère automatiquement les reconnexions
   - **Fermeture brutale** : Le timeout de 30-60s nettoie l'entrée obsolète
