# 👑 Queens Game Web

**Version web responsive du célèbre puzzle Queens de LinkedIn**

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Responsive](https://img.shields.io/badge/Design-Responsive-green?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

## 🎮 À propos du jeu

Le Queens Game est un puzzle logique addictif où vous devez placer des reines sur un plateau de jeu en respectant des règles strictes. Cette version web moderne reproduit fidèlement l'expérience du jeu LinkedIn tout en étant parfaitement responsive pour tous les appareils.

### 🎯 Règles du jeu

- **Objectif** : Placer exactement une reine dans chaque rangée, colonne ET région colorée
- **Contrainte principale** : Les reines ne peuvent pas se toucher (ni horizontalement, ni verticalement, ni en diagonale)
- **Interactions** :
  - **Clic simple** : Place/enlève un marqueur ✗ pour éliminer des possibilités
  - **Double-clic** : Place/enlève une reine ♛
- **Victoire** : Toutes les reines placées correctement selon les règles !

## ✨ Fonctionnalités

### 🎨 Interface utilisateur
- ✅ Design moderne inspiré de LinkedIn
- ✅ Animations fluides et feedback visuel
- ✅ Responsive design (mobile, tablette, desktop)
- ✅ Thème cohérent avec dégradés élégants
- ✅ Accessibilité (contraste, focus visible, support clavier)

### 🎮 Gameplay
- ✅ Génération automatique de niveaux avec régions colorées
- ✅ Validation en temps réel des règles
- ✅ Détection automatique des conflits avec feedback visuel
- ✅ Système de progression et comptage des coups
- ✅ Multiple tailles de grille (4x4 à 8x8)
- ✅ Boutons Reset et Nouveau jeu

### 🔧 Technique
- ✅ TypeScript pour la robustesse du code
- ✅ Architecture modulaire avec hooks React
- ✅ CSS Grid responsive pour le plateau
- ✅ PWA ready avec manifest.json
- ✅ Optimisé pour les performances

## 🚀 Installation et lancement

### Prérequis
- **Node.js** 18+ 
- **npm** ou **yarn**

### Installation rapide

```bash
# Cloner le repository
git clone https://github.com/creach-t/queens-game-web.git
cd queens-game-web

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build

# Prévisualiser la build
npm run preview
```

### 🌐 Accès

Après `npm run dev`, l'application sera disponible sur :
- **Local** : http://localhost:3000
- **Réseau** : Accessible depuis d'autres appareils sur le même réseau

## 🏗️ Architecture du projet

```
src/
├── components/           # Composants React réutilisables
│   ├── GameBoard.tsx     # Plateau de jeu avec grille responsive
│   ├── GameCell.tsx      # Cellule individuelle avec états
│   ├── GameControls.tsx  # Contrôles et statistiques
│   ├── Game.tsx          # Composant principal du jeu
│   └── *.css            # Styles modulaires
├── hooks/               # Logique métier React
│   └── useGameLogic.ts  # Hook principal de gestion d'état
├── types/               # Types TypeScript
│   └── game.ts          # Interfaces du jeu
├── utils/               # Utilitaires et algorithmes
│   ├── gameValidation.ts # Validation des règles
│   └── levelGenerator.ts # Génération de niveaux
├── App.tsx              # Composant racine
├── main.tsx             # Point d'entrée
└── index.css            # Styles globaux et variables CSS
```

## 🎨 Design System

### 🎨 Palette de couleurs
- **LinkedIn Blue** : `#0077b5` (couleur principale)
- **Gradients** : Dégradés modernes pour les backgrounds
- **Regions** : 15+ couleurs distinctes pour les régions
- **States** : Rouge pour les conflits, vert pour la victoire

### 📱 Responsive Breakpoints
- **Desktop** : 1024px+ (grille côte-à-côte)
- **Tablet** : 768px-1023px (layout optimisé)
- **Mobile** : <768px (pile verticale, contrôles en haut)

### ♿ Accessibilité
- Contrastes WCAG AA compliant
- Focus visible pour navigation clavier
- Textes alternatifs et tooltips
- Support du mode haute contraste
- Respect des préférences de mouvement réduit

## 🔧 Technologies utilisées

| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 18.2+ | Framework UI |
| **TypeScript** | 5.0+ | Typage statique |
| **Vite** | 5.1+ | Build tool moderne |
| **CSS Grid** | Native | Layout responsive |
| **CSS Custom Properties** | Native | Théming |

## 🎯 Niveaux de difficulté

| Taille | Difficulté | Régions | Recommandé pour |
|--------|------------|---------|-----------------|
| 4×4 | 🟢 Facile | ~8 | Débutants |
| 5×5 | 🟡 Moyen | ~10 | Intermédiaires |
| 6×6 | 🟠 Difficile | ~12 | Avancés |
| 7×7 | 🔴 Expert | ~14 | Experts |
| 8×8 | ⚫ Maître | ~16 | Maîtres |

## 🎮 Comment jouer

1. **Démarrage** : Un plateau avec des régions colorées est généré
2. **Placement** : Double-cliquez pour placer une reine ♛
3. **Marquage** : Clic simple pour placer un marqueur ✗ (aide-mémoire)
4. **Validation** : Les conflits apparaissent en rouge automatiquement
5. **Victoire** : Toutes les reines placées = puzzle résolu ! 🎉

### 💡 Conseils stratégiques
- Commencez par les régions les plus contraintes
- Utilisez les marqueurs pour éliminer les cases impossibles
- Observez les intersections de lignes/colonnes
- Les reines ne peuvent jamais être adjacentes !

## 🚀 Déploiement

### Netlify/Vercel (recommandé)
```bash
npm run build
# Déployez le dossier dist/
```

### Hébergement statique
```bash
npm run build
# Servez le contenu de dist/ avec n'importe quel serveur web
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. **Committez** vos changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrez** une Pull Request

### 🐛 Signaler un bug
Utilisez les [GitHub Issues](https://github.com/creach-t/queens-game-web/issues) avec :
- Description claire du problème
- Étapes pour reproduire
- Screenshots si pertinent
- Environnement (navigateur, OS, device)

## 📱 Progressive Web App

Cette application est PWA-ready :
- ✅ Installable sur mobile et desktop
- ✅ Fonctionne hors ligne (cache)
- ✅ Icônes et splash screens
- ✅ Manifest.json configuré

## 🎖️ Comparaison avec l'original

| Fonctionnalité | Original LinkedIn | Cette version |
|----------------|-------------------|---------------|
| Plateform | Mobile (app) | Web responsive |
| Langages | Native | React/TypeScript |
| Offline | ✅ | ✅ (PWA) |
| Personnalisation | Limitée | Tailles variables |
| Open Source | ❌ | ✅ |
| Responsive | Mobile only | Tous devices |

## 📈 Roadmap

### 🔄 Améliorations futures
- [ ] Solveur automatique avec hints
- [ ] Système de sauvegarde local
- [ ] Mode sombre/clair
- [ ] Chronomètre et meilleurs scores
- [ ] Animations de victoire avancées
- [ ] Mode multijoueur
- [ ] Générateur de niveaux plus sophistiqué
- [ ] Export/import de puzzles

### 🎯 Optimisations
- [ ] Lazy loading des composants
- [ ] Service Worker pour cache avancé
- [ ] Bundle splitting
- [ ] Tests unitaires et E2E

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteur

**CREACH-T**
- GitHub: [@creach-t](https://github.com/creach-t)
- Projet inspiré du Queens Game de LinkedIn

## 🙏 Remerciements

- **LinkedIn** pour le concept original du Queens Game
- **Communauté React** pour les outils fantastiques
- **Contributeurs** qui améliorent ce projet

---

<div align="center">

**Développé avec ❤️ pour la communauté des puzzle games**

[🎮 Jouer maintenant](https://queens-game-web.netlify.app) • [📖 Documentation](https://github.com/creach-t/queens-game-web/wiki) • [🐛 Signaler un bug](https://github.com/creach-t/queens-game-web/issues)

</div>
