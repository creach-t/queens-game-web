# 👑 Queens Game Web

**Version web responsive du célèbre puzzle Queens de LinkedIn**

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

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
- ✅ Design moderne avec **Tailwind CSS**
- ✅ **Animations fluides** avec overlays et transitions
- ✅ **Loading avec blur** pendant génération des grilles complexes
- ✅ Responsive design (mobile, tablette, desktop)
- ✅ **Architecture modulaire** avec composants décomposés
- ✅ Accessibilité (contraste, focus visible, support clavier)

### 🎮 Gameplay
- ✅ **Chronomètre intégré** avec formatage MM:SS
- ✅ **Partage LinkedIn** avec grille en émojis et score
- ✅ Génération automatique de niveaux avec régions colorées
- ✅ Validation en temps réel des règles
- ✅ Détection automatique des conflits avec feedback visuel
- ✅ **Grilles étendues** de **5×5 à 12×12** (vs 4×4 à 8×8 avant)
- ✅ Animations de construction/destruction du plateau

### 🔧 Technique
- ✅ **TypeScript** pour la robustesse du code
- ✅ **Architecture modulaire** avec séparation des responsabilités
- ✅ **Logique métier pure** extraite dans `lib/game-engine/`
- ✅ **Hooks spécialisés** (useGameLogic, useAnimations)
- ✅ **Tailwind CSS** pour un design system cohérent
- ✅ **Lucide React** pour les icônes modernes
- ✅ PWA ready avec manifest.json

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
- **Demo** : [https://queens-game.creachtheo.fr](https://queens-game.creachtheo.fr)

## 🏗️ Architecture du projet (Nouvelle structure modulaire)

```
src/
├── 📁 components/           # Composants React modulaires
│   ├── 📁 GameBoard/        # Plateau de jeu décomposé
│   │   ├── AnimationOverlay.tsx    # Overlays de transition avec blur
│   │   ├── BoardGrid.tsx           # Grille de cellules
│   │   ├── LoadingState.tsx        # État de chargement
│   │   └── index.tsx               # Point d'entrée du plateau
│   ├── 📁 GameControls/     # Contrôles décomposés
│   │   ├── MainControls.tsx        # Boutons reset/nouveau
│   │   ├── Rules.tsx               # Affichage des règles
│   │   ├── SizeGridSelector.tsx    # Sélecteur de taille
│   │   ├── SuccessMessage.tsx      # Message victoire + partage LinkedIn
│   │   └── index.tsx               # Point d'entrée contrôles
│   ├── Game.tsx             # Composant principal orchestrateur
│   ├── GameCell.tsx         # Cellule individuelle avec états
│   └── Timer.tsx            # Chronomètre avec formatage
├── 📁 hooks/               # Logique métier React
│   ├── useAnimations.ts    # Gestion des animations et transitions
│   └── useGameLogic.ts     # Hook principal de gestion d'état
├── 📁 lib/                 # Logique métier pure
│   └── 📁 game-engine/     # Moteur de jeu extrait
│       ├── rules.ts        # Règles de validation pure
│       └── validator.ts    # Validateur de puzzle
├── 📁 types/               # Types TypeScript
│   ├── core.ts             # Types fondamentaux
│   └── game.ts             # Interfaces du jeu
├── 📁 utils/               # Utilitaires et algorithmes
│   ├── boardUtils.ts       # Utilities plateau
│   ├── gameUtils.ts        # Utilities générales
│   ├── gameValidation.ts   # Validation des règles
│   ├── levelGenerator.ts   # Génération de niveaux
│   ├── levelStorage.ts     # Persistence locale
│   └── queensSolver.ts     # Solveur de puzzles
├── App.tsx                 # Composant racine
├── main.tsx                # Point d'entrée
└── index.css               # Styles globaux Tailwind
```

## 🎨 Design System

### 🎨 Stack technique moderne
- **Tailwind CSS** : Framework CSS utility-first
- **Lucide React** : Icônes modernes et cohérentes
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
| **Tailwind CSS** | 3.0+ | Framework CSS utility-first |
| **Lucide React** | Latest | Bibliothèque d'icônes |

## 🎯 Niveaux de difficulté (Étendus)

| Taille | Difficulté |
|--------|------------|---------|-----------------|-------------|
| 5×5 | Tutoriel | ~5 | Découverte | 2-5 min |
| 6×6 | Facile | ~10 | Débutants | 5-10 min |
| 7×7 | Normal | ~12 | Intermédiaires | 10-15 min |
| 8×8 | Difficile | ~14 | Avancés | 15-25 min |
| 9×9 | Expert | ~16 | Experts | 25-40 min |
| 10×10 | Maître | ~18 | Maîtres | 40-60 min |
| 11×11 | 🔥 Légendaire | ~20 | Légendaires | 60+ min |
| 12×12 | 💎 Mythique | ~22 | Mythiques | 90+ min |

## 🎮 Comment jouer

1. **Démarrage** : Un plateau avec des régions colorées est généré
2. **Placement** : Double-cliquez pour placer une reine ♛
3. **Marquage** : Clic simple pour placer un marqueur ✗ (aide-mémoire)
4. **Validation** : Les conflits apparaissent en rouge automatiquement
5. **Chronomètre** : Votre temps est affiché en temps réel
6. **Victoire** : Puzzle résolu → **Partagez sur LinkedIn !** 📱

### 💡 Conseils stratégiques
- Commencez par les régions les plus contraintes
- Utilisez les marqueurs pour éliminer les cases impossibles
- Observez les intersections de lignes/colonnes
- Les reines ne peuvent jamais être adjacentes !
- Pour les grilles 9+, prenez votre temps et soyez méthodique

## 📱 Partage LinkedIn

Nouvelle fonctionnalité ! Partagez vos victoires directement sur LinkedIn avec :
- 🏆 Votre score et temps de résolution
- 👑 Grille en émojis showing votre solution
- 🔗 Lien vers le jeu pour défier vos contacts
- 📈 Boost votre personal branding tech !

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
| Grilles | 6×6 à 8×8 | **5×5 à 12×12** |
| Chronomètre | ❌ | ✅ |
| Partage | ❌ | ✅ LinkedIn |
| Animations | Basic | ✅ Avancées |
| Open Source | ❌ | ✅ |

## 📈 Nouvelles fonctionnalités 2024

### ✅ Implémentées
- ✅ **Chronomètre** en temps réel avec formatage
- ✅ **Partage LinkedIn** avec grille en émojis
- ✅ **Architecture modulaire** avec composants spécialisés
- ✅ **Animations avancées** avec blur pendant génération
- ✅ **Grilles étendues** jusqu'à 12×12
- ✅ **Design system Tailwind** cohérent
- ✅ **Loading states** optimisés

### 🔄 Roadmap à venir
- [ ] Solveur automatique avec hints
- [ ] Système de sauvegarde local
- [ ] Mode sombre/clair
- [ ] Meilleurs scores et statistiques
- [ ] Mode multijoueur en temps réel
- [ ] Export/import de puzzles
- [ ] Générateur de défis quotidiens

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteur

**CREACH-T**
- GitHub: [@creach-t](https://github.com/creach-t)
- Site: [https://queens-game.creachtheo.fr](https://queens-game.creachtheo.fr)
- Projet inspiré du Queens Game de LinkedIn

## 🙏 Remerciements

- **LinkedIn** pour le concept original du Queens Game
- **Communauté React** pour les outils fantastiques
- **Tailwind Labs** pour le framework CSS moderne
- **Contributeurs** qui améliorent ce projet

---

<div align="center">

**Développé avec ❤️ pour la communauté des puzzle games**

[🎮 Jouer maintenant](https://queens-game.creachtheo.fr) • [📖 Documentation](https://github.com/creach-t/queens-game-web/wiki) • [🐛 Signaler un bug](https://github.com/creach-t/queens-game-web/issues)

**⭐ N'oubliez pas de starrer le repo si vous aimez le projet ! ⭐**

</div>