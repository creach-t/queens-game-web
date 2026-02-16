# Firebase Rules Update - Game Statistics

## Nouvelles règles ajoutées

Les règles Firebase ont été mises à jour pour supporter le compteur de parties jouées.

### Nouveau nœud dans la base de données

```json
"stats": {
  "total_games": {
    ".read": true,
    ".write": "auth != null"
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
└── stats/
    └── total_games           (lecture publique, écriture authentifiée)
```

## Comportement

- **Lecture** : Accessible à tous (même sans authentification)
- **Écriture** : Nécessite une authentification anonyme
- Le compteur est incrémenté automatiquement à chaque nouvelle partie chargée
- Le cache côté client (1 minute) réduit la charge sur Firebase
