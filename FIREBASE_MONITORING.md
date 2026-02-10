# Monitoring Firebase - Queens Game Web

## 🔥 Incident : Pic de 69 GB

### Cause identifiée
Le système de leaderboard chargeait les données à chaque render du composant, provoquant potentiellement des centaines de requêtes par utilisateur.

### Problèmes corrigés (commit acc2dae)

1. **Pas de cache** → Ajout d'un cache de 30 secondes côté client
2. **Requêtes en double** → Ajout de `loadingRef` pour bloquer les requêtes concurrentes
3. **Rechargements inutiles** → Vérification de `lastLoadedGridSize` avant fetch
4. **Pas d'invalidation** → Cache invalidé automatiquement après sauvegarde de score

## 📊 Utilisation Firebase normale attendue

### Par utilisateur (session typique ~10 minutes)

**Lecture (Download)** :
- Chargement niveau initial : ~2 KB
- Chargement leaderboard top 3 (8 tailles) : ~8 × 0.5 KB = 4 KB
- **Total lecture** : ~6 KB par session

**Écriture (Upload)** :
- Sauvegarde 1 score : ~200 bytes
- **Total écriture** : ~200 bytes par session

### Estimations mensuelles (1000 utilisateurs actifs/mois)

- **Lectures** : 1000 × 6 KB = 6 MB/mois
- **Écritures** : 1000 × 200 bytes = 200 KB/mois
- **Total** : ~6 MB/mois

**Note** : Leaderboard limité au top 3 pour réduire la bande passante (au lieu du top 10)

## 🚨 Signes d'alerte

### Pics anormaux
Si vous voyez :
- **> 1 GB/jour** → Boucle de requêtes ou bot
- **> 100 requêtes/seconde** → Attaque DDoS ou bug
- **> 10 MB/utilisateur** → Problème de cache ou rechargements infinis

### Actions immédiates

1. **Vérifier les logs de la console navigateur** :
   ```
   [Cache] Leaderboard 6x6 depuis cache  ← NORMAL
   [Firebase] Chargement leaderboard 6x6 ← MAX 1 fois/30s/taille
   ```

2. **Activer le monitoring Firebase** :
   - Console Firebase → Analytics → Usage
   - Créer des alertes à 100 MB/jour

3. **Limiter l'accès si nécessaire** :
   - Règles Firebase → Ajouter rate limiting
   - Bloquer IPs suspectes

## 🛡️ Protections en place

### 1. Cache côté client (30 secondes)
```typescript
// levelStorage.ts
private leaderboardCache: Map<number, { data: LeaderboardData; timestamp: number }> = new Map();
private readonly CACHE_DURATION = 30000; // 30 secondes
```

**Impact** : Réduit 90% des requêtes redondantes

### 2. Prévention des doublons
```typescript
// Leaderboard.tsx
const loadingRef = useRef(false);
if (loadingRef.current) return; // Bloque si déjà en cours
```

**Impact** : Évite les requêtes en parallèle

### 3. Vérification avant chargement
```typescript
if (lastLoadedGridSize.current === gridSize && leaderboardData.entries.length > 0) {
  return; // Déjà chargé
}
```

**Impact** : Évite rechargements inutiles

### 4. Top 3 au lieu de Top 10
```typescript
const topQuery = query(leaderboardRef, orderByChild("time"), limitToFirst(3));
```

**Impact** : Réduit 70% de la bande passante leaderboard

### 5. Mise à jour intelligente par nom
- Si un joueur avec le même nom existe, mise à jour uniquement si meilleur temps
- Évite la duplication des entrées pour un même joueur
- Réduit la croissance de la base de données

### 6. Index Firebase optimisé
```json
".indexOn": ["time"]
```

**Impact** : Réduit le coût CPU et bande passante Firebase

## 📈 Monitoring recommandé

### Console Firebase
1. **Realtime Database → Usage** :
   - Downloads
   - Storage
   - Simultaneous connections

2. **Créer des alertes** :
   - Download > 500 MB/jour
   - Storage > 100 MB
   - Connections > 100 simultanées

### Console navigateur (Dev)
Ouvrir la console et chercher :
```
[Cache] Leaderboard X×X depuis cache  ← Bon signe (cache hit)
[Firebase] Chargement leaderboard X×X  ← Ok si rare (1 fois/30s max)
Erreur récupération leaderboard        ← Vérifier règles Firebase
```

### Google Analytics (si configuré)
- Temps de session moyen
- Taux de rebond
- Pages vues par session

## 🔧 Optimisations futures possibles

### Si l'utilisation reste élevée :

1. **Augmenter le cache à 5 minutes** :
   ```typescript
   private readonly CACHE_DURATION = 300000; // 5 minutes
   ```

2. **Charger le leaderboard uniquement sur demande** :
   - Bouton "Voir le classement"
   - Au lieu de chargement automatique

3. **Pagination côté serveur** :
   - Top 3 par défaut
   - "Voir plus" pour top 10

4. **Firebase Functions pour agrégation** :
   - Pré-calculer le top 10 toutes les heures
   - Stocker dans un nœud `/leaderboards_cache/`

5. **CDN pour données statiques** :
   - Exporter top 10 vers JSON statique
   - Héberger sur Cloudflare/Vercel

## 📝 Checklist après déploiement

- [ ] Vérifier les logs console (pas d'erreurs)
- [ ] Confirmer cache hit après 2e chargement
- [ ] Monitorer Firebase pendant 24h
- [ ] Vérifier que Download < 100 MB/jour
- [ ] Configurer alertes Firebase
- [ ] Documenter l'utilisation baseline

## 🆘 Contact urgence

Si pic de bande passante :

1. **Désactiver temporairement le leaderboard** :
   ```typescript
   // SuccessMessage.tsx
   // <Leaderboard ... /> → Commenter cette ligne
   ```

2. **Augmenter le cache** :
   ```typescript
   private readonly CACHE_DURATION = 3600000; // 1 heure
   ```

3. **Limiter dans les règles Firebase** :
   ```json
   ".read": "auth != null" // Forcer authentification pour lecture
   ```

## 📚 Ressources

- [Firebase Pricing](https://firebase.google.com/pricing)
- [Realtime Database Best Practices](https://firebase.google.com/docs/database/usage/optimize)
- [Rate Limiting with Firebase](https://firebase.google.com/docs/rules/rules-and-auth#leverage_user-based_security)
