# 🎨 Canvas Drag System - Documentation

## 🚀 Nouveautés de cette branche

Cette branche `feature/canvas-drag-system` ajoute un **système de drag fluide** au Queens Game web en utilisant Canvas, tout en conservant parfaitement l'expérience existante.

## ✨ Fonctionnalités ajoutées

### 🎯 Système de drag pour marqueurs
- **Drag rapide** : Marquez plusieurs cellules d'un seul geste
- **Mode intelligent** : 
  - Drag sur cellules vides → Les marque instantanément (✗)
  - Drag sur cellules marquées → Les démarque instantanément
- **Protection des reines** : Le drag ne peut pas toucher aux reines ♛
- **Support universel** : Fonctionne sur desktop (mouse) et mobile (touch)

### 🎮 Interface hybride
- **Toggle Canvas/DOM** : Bouton pour basculer entre les deux modes
- **Canvas Mode** (par défaut) : Système de drag + rendu optimisé
- **DOM Mode** : Mode original pour comparaison

### 🎨 Rendu Canvas fidèle
- **Style identique** : Reproduction exacte du style DOM existant
- **Bordures de régions** : Même logique de délimitation colorée
- **Animations** : Conflits en rouge hachuré, victoire en or
- **Responsive** : Adaptatif selon la taille d'écran

## 🔧 Architecture technique

### Nouveaux fichiers
```
src/components/CanvasGameBoard.tsx  # Composant Canvas avec drag
```

### Fichiers modifiés
```
src/hooks/useGameLogic.ts          # + handleCellDrag()
src/components/Game.tsx            # Toggle Canvas/DOM
```

### Interface de drag
```typescript
// Nouvelle fonction dans useGameLogic
handleCellDrag: (row: number, col: number, dragMode: 'mark' | 'unmark') => void
```

## 🎲 Comment utiliser

### 1. Mode Canvas (recommandé)
1. **Checkbox activée** : "🎨 Canvas + Drag System"
2. **Clic simple** : Toggle marqueur ✗ (comme avant)
3. **Double-clic** : Toggle reine ♛ (comme avant)
4. **Drag** : Marquer/démarquer plusieurs cellules rapidement

### 2. Mode DOM (original)
1. **Checkbox désactivée** : Mode original sans drag
2. **Comportement identique** à la version principale

## 🔄 Interactions détaillées

### Système de clic (inchangé)
- **Clic simple** → Toggle marqueur sur cellules vides/marquées
- **Double-clic** → Toggle reine partout, efface marqueur si nécessaire
- **Détection automatique** du type de clic (timeout 250ms)

### Nouveau système de drag
- **Seuil minimal** : 2px de mouvement pour déclencher
- **Mode déterminé** par l'état de la cellule de départ :
  - Cellule vide → Mode "mark" (marquer)
  - Cellule marquée → Mode "unmark" (démarquer)
- **Application instantanée** sans prévisualisation
- **Respect des limites** : Ne touche jamais aux reines

## 🎯 Avantages du Canvas

### Performance
- ✅ Rendu plus fluide pour le drag
- ✅ Pas de manipulation DOM coûteuse
- ✅ Événements plus simples et directs

### Fonctionnalités
- ✅ Drag multi-cellules impossible en DOM React
- ✅ Rendu unifié et contrôlé
- ✅ Support mouse/touch natif
- ✅ Aucun conflit avec React

### Compatibilité
- ✅ Rendu visuel identique au DOM
- ✅ Conservation totale du système existant
- ✅ Responsive et mobile-friendly
- ✅ Animations et effets préservés

## 📱 Support mobile

Le système Canvas fonctionne parfaitement sur mobile :
- **Touch events** natifs avec `PointerEvent`
- **Scroll bloqué** avec `touch-action: none`
- **Seuil de drag** adapté au touch
- **Performance optimisée** pour les appareils mobiles

## 🧪 Tests recommandés

### Desktop
- [ ] Clic simple/double avec souris
- [ ] Drag horizontal/vertical/diagonal
- [ ] Drag à travers différentes régions
- [ ] Performance sur grandes grilles (7x7, 8x8)

### Mobile/Tablette
- [ ] Touch simple/double
- [ ] Drag tactile fluide
- [ ] Pas de scroll parasite
- [ ] Responsive sur différentes tailles

### Edge cases
- [ ] Drag sur reines (doit être bloqué)
- [ ] Drag pendant animation de victoire
- [ ] Basculement Canvas ↔ DOM
- [ ] Nouveau jeu avec drag actif

## 🔍 Debugging

### Console logs utiles
```javascript
// Dans CanvasGameBoard.tsx
console.log('Drag mode:', dragMode, 'Cell:', row, col);
console.log('Cell state:', cell.state, '→', newState);
```

### États de debug
- `dragState.isDragging` : Drag en cours
- `dragState.dragMode` : 'mark' | 'unmark' | null
- `isGameBlocked` : Jeu bloqué (génération/victoire)

## 🚀 Performance

### Optimisations Canvas
- **RequestAnimationFrame** pour le rendu fluide
- **Nettoyage automatique** des event listeners
- **Calculs mis en cache** (cellSize, positions)
- **Événements PointerEvent** unifiés

### Mémoire
- **Cleanup automatique** des timeouts dans useGameLogic
- **Références stable** avec useCallback/useMemo
- **Pas de fuites mémoire** Canvas

## 🎨 Personnalisation

### Constantes modifiables
```typescript
const BORDER_WIDTH = 3;           // Épaisseur bordures régions
const BORDER_COLOR = '#2c3e50';   // Couleur bordures
const DRAG_THRESHOLD = 2;         // Seuil drag en pixels
```

### Styles
Le Canvas respecte automatiquement :
- Variables CSS du projet (couleurs LinkedIn)
- Système responsive existant
- Animations et états visuels

## 🔄 Roadmap

### Version actuelle (v1.0)
- ✅ Système de drag basic mark/unmark
- ✅ Reproduction fidèle du style DOM
- ✅ Support mouse + touch
- ✅ Toggle Canvas/DOM

### Futures améliorations
- [ ] Prévisualisation du drag
- [ ] Animations de drag avancées
- [ ] Multi-sélection avec Ctrl/Cmd
- [ ] Patterns de drag prédéfinis
- [ ] Historique undo/redo de drag

## 📝 Contribution

Pour contribuer à cette fonctionnalité :

1. **Base** : Branche `feature/canvas-drag-system`
2. **Tests** : Vérifier compatibilité mobile
3. **Performance** : Profiler sur grandes grilles
4. **UX** : Feedback utilisateur sur le drag

---

**Développé avec ❤️ pour une expérience de jeu plus fluide !**